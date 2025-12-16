# EmailJS Setup Instructions

To enable email sending from the "Book a Demo" form, you need to set up EmailJS:

## Step 1: Create EmailJS Account
1. Go to https://www.emailjs.com/
2. Sign up for a free account (free tier allows 200 emails/month)

## Step 2: Create Email Service
1. In EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your email provider (Gmail recommended)
4. Follow the connection steps
5. Copy your **Service ID**

## Step 3: Create Email Template
1. Go to "Email Templates"
2. Click "Create New Template"
3. Use this template:

**Template Name:** Demo Request

**Subject:** Demo Request from {{from_name}}

**Content:**
```
{{message}}

---
From: {{from_name}} ({{from_email}})
Reply to: {{reply_to}}
```

**Settings:**
- **To Email:** info@wovlabs.com
- **CC:** Americo.cacciapuoti@wovlabs.com,shqiprim.bruti@wovlabs.com
- **From Name:** {{from_name}}
- **From Email:** {{from_email}}
- **Reply To:** {{reply_to}}

4. Copy your **Template ID**

## Step 4: Get Public Key
1. Go to "Account" → "General"
2. Copy your **Public Key**

## Step 5: Update book-demo.html
Open `book-demo.html` and find the `EMAILJS_CONFIG` object (around line 360).
Replace:
- `YOUR_PUBLIC_KEY` with your Public Key
- `YOUR_SERVICE_ID` with your Service ID  
- `YOUR_TEMPLATE_ID` with your Template ID

## Alternative: Use Backend
If you prefer not to use EmailJS, you can:
1. Set up a simple PHP/Node.js backend
2. Update the form submission to POST to your backend endpoint
3. Send emails using your server's email capabilities

