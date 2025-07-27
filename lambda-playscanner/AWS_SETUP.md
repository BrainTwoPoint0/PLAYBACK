# AWS Setup Guide for PLAYScanner Lambda

## 1. Configure AWS CLI

First, you need to configure your AWS credentials:

```bash
aws configure
```

You'll be prompted for:

- **AWS Access Key ID**: Get from AWS IAM console
- **AWS Secret Access Key**: Get from AWS IAM console
- **Default region name**: `eu-west-2` (London)
- **Default output format**: `json`

## 2. Get AWS Credentials

### Option A: Create New IAM User (Recommended)

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click "Users" → "Add users"
3. User name: `playscanner-deployer`
4. Select "Access key - Programmatic access"
5. Attach policies:
   - `AWSLambdaFullAccess`
   - `IAMFullAccess` (or create custom policy)
   - `CloudWatchEventsFullAccess`
6. Download credentials CSV

### Option B: Use Root Account (Not Recommended)

1. Go to [AWS Security Credentials](https://console.aws.amazon.com/iam/home#/security_credentials)
2. Create new access key
3. Download credentials

## 3. Create Lambda Execution Role

Once AWS CLI is configured, create the role:

```bash
# Create the execution role
aws iam create-role --role-name playscanner-lambda-role \
  --assume-role-policy-document file://trust-policy.json

# Attach basic Lambda execution policy
aws iam attach-role-policy --role-name playscanner-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Get the role ARN (save this for deployment)
aws iam get-role --role-name playscanner-lambda-role \
  --query 'Role.Arn' --output text
```

## 4. Alternative: AWS Console Setup

If you prefer using the AWS Console:

### Create Role via Console:

1. Go to [IAM Roles](https://console.aws.amazon.com/iam/home#/roles)
2. Click "Create role"
3. Select "Lambda" as the trusted entity
4. Attach policy: `AWSLambdaBasicExecutionRole`
5. Role name: `playscanner-lambda-role`
6. Copy the Role ARN

### Create Lambda via Console:

1. Go to [Lambda Console](https://console.aws.amazon.com/lambda/)
2. Click "Create function"
3. Function name: `playscanner-collector`
4. Runtime: Node.js 20.x
5. Use existing role: `playscanner-lambda-role`
6. Upload the zip file created by the deploy script

## 5. Environment Variables

After creating the Lambda function, add these environment variables in the console:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Your Supabase service role key
- `NODE_ENV`: `production`

## 6. Free Tier Limits

AWS Lambda Free Tier includes:

- 1 Million requests per month
- 400,000 GB-seconds compute time
- No charge for EventBridge rules

Your usage (48 executions/day):

- ~1,440 requests/month (well under limit)
- ~22,000 GB-seconds/month (well under limit)
- **Total cost**: $0

## 7. Minimal IAM Policy

If you want to create a minimal policy for the deployer user:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:CreateFunction",
        "lambda:UpdateFunctionCode",
        "lambda:UpdateFunctionConfiguration",
        "lambda:GetFunction",
        "lambda:AddPermission",
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "iam:GetRole",
        "iam:PassRole",
        "events:PutRule",
        "events:PutTargets",
        "logs:CreateLogGroup",
        "logs:PutRetentionPolicy"
      ],
      "Resource": "*"
    }
  ]
}
```

## Next Steps

Once AWS CLI is configured:

```bash
# Test AWS CLI is working
aws sts get-caller-identity

# Continue with deployment
./deploy.sh
```
