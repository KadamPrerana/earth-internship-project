# AWS Deployment Guide — Task Manager App

Complete step-by-step guide documenting exactly what we did to deploy the Task Manager application on AWS.

---

## Architecture Setup
- **Backend + Database**: Running in Docker containers (Django + MongoDB) on a Linux EC2 instance.
- **Frontend**: Hosted globally as a static website on an AWS S3 Bucket.
- **Container Registry**: Docker images backed up to AWS ECR.
- **Monitoring**: AWS CloudWatch Agent streaming CPU, Memory, and Disk metrics from EC2.

---

## 1. Backend + Database on EC2

### 1.1 Launching the Server
1. We launched an Ubuntu EC2 instance (`t2.micro`).
2. We attached a Security Group (`earth-task-manager-sg`) which acts as a virtual firewall. We opened specific ports:
   - **Port 22 (SSH)**: Secure Shell. Allows you to remotely log into the server's terminal from your laptop. 
   - **Port 8000 (Custom TCP)**: Our Django API runs here. It must be public (`0.0.0.0/0`) so the React frontend hosted on S3 can send requests to it.
   - **Port 27017 (Custom TCP)**: MongoDB default port. **Why open it if it's not public?** When we configure this in AWS, we set the source to our private VPC IP range (e.g., `172.31.0.0/16`), *not* the internet (`0.0.0.0/0`). This means only other servers securely living inside your AWS private network can access it, keeping hackers out. *(Note: Because our Django and MongoDB containers live on the exact same server managed by Docker Compose, they communicate through an internal Docker network anyway, so port 27017 doesn't even strictly need to be in the AWS Security Group for them to talk to each other!)*
3. We installed Docker and `docker-compose` on the instance.

### 1.2 Transferring Backend Files
From your local machine, we copied the backend files to the EC2 server using your private key:
```bash
scp -i /home/prerana/Desktop/Earth_s/earth-key.pem -r /home/prerana/Desktop/Earth_s/project/earth-backend /home/prerana/Desktop/Earth_s/project/docker-compose.yml ubuntu@<YOUR_EC2_IP>:~/
```

### 1.3 Django Configuration
We updated `ALLOWED_HOSTS` in `settings.py` to allow the EC2 public IP to accept requests:
```python
ALLOWED_HOSTS = ['*']
```

### 1.4 Starting the Backend Server
SSH into your EC2 instance:
```bash
ssh -i /path/to/earth-key.pem ubuntu@<YOUR_EC2_IP>
```

To **START** the servers securely in the background:
```bash
docker-compose up --build -d
```

To **STOP** the servers:
```bash
docker-compose down
```

To view backend logs (helpful for debugging):
```bash
docker-compose logs -f backend
```

---

## 2. Frontend Hosting on S3

We deployed the React frontend to an AWS S3 bucket so it loads instantly anywhere in the world.

### 2.1 Build the Frontend
On your local machine, we built the React app, telling it what IP address the backend was living at:
```bash
cd earth-frontend
REACT_APP_API_URL=http://<YOUR_EC2_IP>:8000 npm run build
```

### 2.2 S3 Bucket Configuration
We created the bucket `earth-task-manager-frontend-123` in `us-east-1` and made it public:
```bash
# Unblock public access
aws s3api put-public-access-block --bucket earth-task-manager-frontend-123 --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" --region us-east-1

# Add standard public-read policy
aws s3api put-bucket-policy --bucket earth-task-manager-frontend-123 --policy '{"Version":"2012-10-17","Statement":[{"Sid":"PublicRead","Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::earth-task-manager-frontend-123/*"}]}' --region us-east-1

# Enable website hosting mode
aws s3 website s3://earth-task-manager-frontend-123 --index-document index.html --error-document index.html --region us-east-1
```

### 2.3 Uploading to S3
Every time you **update** the frontend, run this command to push the new code to S3:
```bash
aws s3 sync build/ s3://earth-task-manager-frontend-123 --delete --region us-east-1
```

**Website URL:** [http://earth-task-manager-frontend-123.s3-website-us-east-1.amazonaws.com](http://earth-task-manager-frontend-123.s3-website-us-east-1.amazonaws.com)

---

## 3. Pushing Docker Images to ECR

We saved your Docker images directly onto AWS Elastic Container Registry (ECR).

### 3.1 Initialize Repositories
On AWS Console, we created an IAM User with `AmazonEC2ContainerRegistryFullAccess`.
Then we generated the repositories:
```bash
aws ecr create-repository --repository-name earth-backend --region us-east-1
aws ecr create-repository --repository-name earth-frontend --region us-east-1
```

### 3.2 Tag and Push (from EC2)
Since the working image was on EC2, we ran this inside the EC2 instance terminal:
```bash
# Authenticate
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 122976267974.dkr.ecr.us-east-1.amazonaws.com

# Tag 
docker tag ubuntu_backend:latest 122976267974.dkr.ecr.us-east-1.amazonaws.com/earth-backend:latest

# Push
docker push 122976267974.dkr.ecr.us-east-1.amazonaws.com/earth-backend:latest
```

---

## 4. CloudWatch Monitoring

We attached an IAM Role to the EC2 instance featuring the `CloudWatchAgentServerPolicy`, which gives the EC2 machine permission to talk to AWS CloudWatch.

### 4.1 Install and Configure Agent
Inside the EC2 instance:
```bash
# Install
wget https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb

# Write Configuration
sudo tee /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "cwagent"
  },
  "metrics": {
    "append_dimensions": { "InstanceId": "${aws:InstanceId}" },
    "metrics_collected": {
      "cpu": { "measurement": ["cpu_usage_idle", "cpu_usage_user", "cpu_usage_system"] },
      "mem": { "measurement": ["mem_used_percent"] },
      "disk": {"measurement": ["used_percent"], "resources": ["*"] }
    }
  }
}
EOF

# Start the Agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
```

**Viewing Metrics:** 
Go to **AWS Console → CloudWatch → Metrics → All metrics → CWAgent**. Here you can graph "mem_used_percent" and "cpu_usage_user" entirely for free!

---

## 5. Viewing Your Database Data

The MongoDB database runs inside a Docker container on the EC2 instance. To view the raw users and tasks:

### 5.1 Connect to the MongoDB Shell
SSH into your EC2 instance and run this command to enter the MongoDB interactive terminal:
```bash
# Enter the interactive mongosh shell inside the Docker container
docker exec -it earth_mongo mongosh
```

### 5.2 Query the Data
Once inside the `mongosh>` prompt, run:
```javascript
// 1. Switch to your application's database
use intern_db

// 2. View all registered Users
db.user.find().pretty()

// 3. View all created Tasks
db.task.find().pretty()

// 4. Exit the shell
exit
```
