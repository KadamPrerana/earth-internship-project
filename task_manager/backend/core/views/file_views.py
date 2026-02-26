import os
import boto3
from django.http import JsonResponse
from rest_framework.decorators import api_view
from core.models import Task, ActivityLog
import uuid
from datetime import datetime
from botocore.exceptions import ClientError

# Initialize S3 Client.
# AWS credentials will be automatically picked up from standard AWS environment variables
# or IAM roles if deployed on EC2/Lambda.
s3_client = boto3.client(
    's3',
    region_name=os.getenv('AWS_REGION', 'us-east-1')
)
BUCKET_NAME = os.getenv('S3_BUCKET_NAME', 'earth-task-manager-frontend-pk-us')

def get_task_or_404(task_id, user):
    """Helper to fetch a task ensuring the user has access."""
    if user.role == 'admin':
        task = Task.objects(id=task_id).first()
    else:
        # User must be assigned to or have created it
        task = Task.objects(id=task_id).filter(__raw__={'$or': [{'assigned_to': user.email}, {'created_by': user.email}]}).first()
    return task

@api_view(['POST'])
def generate_upload_url(request, task_id):
    """Generate a presigned S3 URL for uploading a file."""
    user = request.auth_user
    task = get_task_or_404(task_id, user)
    if not task:
        return JsonResponse({'error': 'Task not found or unauthorized'}, status=404)

    filename = request.data.get('filename')
    if not filename:
        return JsonResponse({'error': 'filename is required'}, status=400)

    # Generate a unique S3 key to prevent overwriting
    s3_key = f"tasks/{task_id}/{uuid.uuid4().hex[:8]}_{filename}"

    try:
        presigned_url = s3_client.generate_presigned_url(
            ClientMethod='put_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': s3_key,
                'ContentType': request.data.get('contentType', 'application/octet-stream')
            },
            ExpiresIn=3600 # 1 hour
        )
        return JsonResponse({
            'upload_url': presigned_url,
            's3_key': s3_key,
            'filename': filename
        })
    except ClientError as e:
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['POST'])
def confirm_upload(request, task_id):
    """Confirm an S3 upload was successful and attach it to the task."""
    user = request.auth_user
    task = get_task_or_404(task_id, user)
    if not task:
        return JsonResponse({'error': 'Task not found or unauthorized'}, status=404)

    s3_key = request.data.get('s3_key')
    filename = request.data.get('filename')

    if not s3_key or not filename:
        return JsonResponse({'error': 's3_key and filename are required'}, status=400)

    # Add to attachments
    attachment = {
        'filename': filename,
        's3_key': s3_key,
        'uploaded_at': datetime.now().isoformat(),
        'uploaded_by': user.email
    }
    
    # MongoEngine handling for ListField(DictField)
    task.update(push__attachments=attachment, set__updated_at=datetime.now())
    task.reload()

    # Log activity
    ActivityLog(user_email=user.email, action='file_attached', details=f'Attached {filename} to task {task.title}').save()

    return JsonResponse({'message': 'File attached successfully', 'task': task.to_dict()})


@api_view(['GET'])
def generate_download_url(request, task_id):
    """Generate a presigned S3 URL for downloading a file."""
    user = request.auth_user
    task = get_task_or_404(task_id, user)
    if not task:
        return JsonResponse({'error': 'Task not found or unauthorized'}, status=404)

    s3_key = request.GET.get('s3_key')
    if not s3_key:
        return JsonResponse({'error': 's3_key query parameter is required'}, status=400)

    # Verify the task actually has this attachment
    if not any(att.get('s3_key') == s3_key for att in task.attachments):
        return JsonResponse({'error': 'Attachment not found on this task'}, status=404)

    try:
        presigned_url = s3_client.generate_presigned_url(
            ClientMethod='get_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': s3_key
            },
            ExpiresIn=3600 # 1 hour
        )
        return JsonResponse({'download_url': presigned_url})
    except ClientError as e:
        return JsonResponse({'error': str(e)}, status=500)
