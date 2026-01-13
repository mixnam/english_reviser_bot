#!/bin/bash

# Configuration
# These must match the values in your GitHub Workflow (.github/workflows/deploy_client.yml)
PROJECT_ID=$(gcloud config get-value project)
REGION="europe-west1"
REPO_NAME="client-repo"
MIG_NAME="client-mig"
SERVICE_ACCOUNT="client-sa"

# 1. Enable necessary Google Cloud APIs
echo "Enabling Artifact Registry and Compute Engine APIs..."
gcloud services enable artifactregistry.googleapis.com compute.googleapis.com

# 2. Create Artifact Registry Repository (to store Docker images)
echo "Creating Artifact Registry Repository '$REPO_NAME'..."
if ! gcloud artifacts repositories describe $REPO_NAME --location=$REGION &>/dev/null; then
    gcloud artifacts repositories create $REPO_NAME \
        --repository-format=docker \
        --location=$REGION \
        --description="Docker repository for Client"
else
    echo "Repository $REPO_NAME already exists."
fi

# 3. Create a Service Account for the VM
echo "Creating Service Account '$SERVICE_ACCOUNT'..."
if ! gcloud iam service-accounts describe $SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com &>/dev/null; then
    gcloud iam service-accounts create $SERVICE_ACCOUNT \
        --display-name="Client VM Service Account"
else
    echo "Service Account $SERVICE_ACCOUNT already exists."
fi

# Grant the Service Account permission to read images from Artifact Registry
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.reader"

# 4. Create an Initial Placeholder Instance Template
# The GitHub Action will replace this with your actual app later.
TEMPLATE_NAME="client-template-base"
echo "Creating Base Instance Template '$TEMPLATE_NAME'..."
if ! gcloud compute instance-templates describe $TEMPLATE_NAME --region=$REGION &>/dev/null; then
    gcloud compute instance-templates create-with-container $TEMPLATE_NAME \
        --container-image="us-docker.pkg.dev/cloudrun/container/hello" \
        --region=$REGION \
        --machine-type=e2-micro \
        --network-interface=network=default,access-config=default \
        --service-account=$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com \
        --scopes=cloud-platform \
        --tags=http-server \
        --boot-disk-size=10GB \
        --boot-disk-type=pd-balanced
else
    echo "Instance Template $TEMPLATE_NAME already exists."
fi

# 5. Create Managed Instance Group (MIG)
# This manages your VMs (auto-healing, rolling updates)
echo "Creating Managed Instance Group '$MIG_NAME'..."
if ! gcloud compute instance-groups managed describe $MIG_NAME --region=$REGION &>/dev/null; then
    gcloud compute instance-groups managed create $MIG_NAME \
        --base-instance-name="client" \
        --template=$TEMPLATE_NAME \
        --size=1 \
        --region=$REGION \
        --target-distribution-shape=EVEN
        
    # (Optional) Set Named Port if you plan to add a Load Balancer later
    gcloud compute instance-groups managed set-named-ports $MIG_NAME \
        --named-ports=http:3000 \
        --region=$REGION
else
    echo "MIG $MIG_NAME already exists."
fi

# 6. Create Firewall Rule
# Allow traffic on port 3000
echo "Creating Firewall Rule 'allow-client-http'..."
if ! gcloud compute firewall-rules describe allow-client-http &>/dev/null; then
    gcloud compute firewall-rules create allow-client-http \
        --action=ALLOW \
        --rules=tcp:3000 \
        --source-ranges=0.0.0.0/0 \
        --target-tags=http-server
else
    echo "Firewall rule allow-client-http already exists."
fi

echo "--------------------------------------------------------"
echo "Setup complete! Your environment is ready."
echo "You can now run the 'Deploy Client to GCE (MIG)' workflow in GitHub."
