# Final Submission Guide

This document outlines the final deliverables, how the CI/CD pipeline is configured, how logging and monitoring work, and steps for final submission.

## 1. GitHub Actions CI/CD Pipeline
We have configured an automated pipeline using **GitHub Actions**. The configuration file is located at `.github/workflows/ci.yml`.

### How it works:
- **Trigger**: The pipeline runs automatically whenever someone opens a Pull Request (PR) to the `main` branch or pushes code to `main`.
- **Backend Tests**: It spins up a temporary MongoDB service, installs Python dependencies, and runs all Django unit tests.
- **Frontend Tests**: It sets up Node.js, installs React dependencies, and runs the Jest test suite.
- **Docker Builds**: If the tests pass, it verifies that both the `earth-backend` and `earth-frontend` Docker images can build successfully without errors.

This ensures no broken code is ever merged into the main branch!

---

## 2. Logging and Monitoring
We have implemented comprehensive logging and monitoring across the stack.

### Application Logging (Backend)
- Django is configured to print standard HTTP requests and error logs to the console using Gunicorn/Django development server.
- Because the backend runs in a Docker container, all logs are captured by the Docker daemon. You can view them anytime via:
  ```bash
  docker-compose logs -f backend
  ```

### Infrastructure Monitoring (AWS CloudWatch)
- We installed the **Amazon CloudWatch Agent** on the EC2 instance.
- It continuously monitors **CPU Utilization**, **Memory Usage**, and **Disk Space**.
- **Metrics Location**: In your AWS Console, go to **CloudWatch → Metrics → CWAgent**.
- **Alarms**: You can easily configure CloudWatch Alarms to send you an email via Amazon SNS if CPU or Memory goes above 80%.

---

## 3. Deployment Summary
The application is fully deployed on AWS:
- **Frontend**: Hosted globally on an **S3 Bucket** configured for static website hosting.
- **Backend**: Containerized with Django and MongoDB, running securely on an **EC2 Instance**.
- **Container Registry**: Docker images are securely backed up to AWS **Elastic Container Registry (ECR)**.
- **Security**: Security Groups act as a firewall, only allowing SSH (22) and HTTP API (8000) requests, keeping the internal MongoDB safe.

*See `docs/AWS_DEPLOYMENT_GUIDE.md` for full deployment recreation steps.*

---

## 4. Final Submission Checklist
To finalize your project submission, make sure you complete the following steps:

1. **Commit and Push all code to GitHub**:
   ```bash
   git add .
   git commit -m "Final Submission: Added CI/CD, Monitoring, and Documentation"
   git push origin main
   ```
2. **Verify CI Pipeline**: Check your GitHub repository's "Actions" tab to ensure the green checkmark appears (meaning all tests and builds passed).
3. **Submit Links**: Provide the following to your reviewers/instructors:
   - **GitHub Repository URL**: URL to your code.
   - **Live Frontend URL**: `http://earth-task-manager-frontend-123.s3-website-us-east-1.amazonaws.com`
   - **Backend API URL**: `http://54.198.150.148:8000/api/users/list/`
4. **Documentation**: Ensure the `docs/` folder is included in your repository so reviewers can see your Deployment, Docker, and Testing guides.
