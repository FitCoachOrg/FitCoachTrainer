# Email Service Setup Guide

## 🚀 **Quick Email Service Options**

Since Mailgun is having issues, here are better alternatives:

### **Option 1: Resend (Recommended)**
- **Free tier**: 3,000 emails/month
- **Simple setup**: Just API key
- **Good deliverability**

### **Option 2: SendGrid**
- **Free tier**: 100 emails/day
- **Widely used**: Good documentation
- **Reliable delivery**

### **Option 3: Brevo (formerly Sendinblue)**
- **Free tier**: 300 emails/day
- **Good for transactional emails**
- **Easy setup**

## 🔧 **Setup with Resend (Recommended)**

### **Step 1: Sign up for Resend**
1. Go to [resend.com](https://resend.com)
2. Sign up for free account
3. Get your API key

### **Step 2: Set Environment Variables**
```bash
# Set Resend API key
supabase secrets set EMAIL_SERVICE_API_KEY=re_xxxxxxxxxxxx

# Set from email
supabase secrets set EMAIL_FROM=noreply@repute.cloud

# Set frontend URL
supabase secrets set FRONTEND_URL=https://repute.cloud
```

### **Step 3: Deploy Updated Function**
```bash
supabase functions deploy send_client_invitation
```

## 🔧 **Setup with SendGrid**

### **Step 1: Sign up for SendGrid**
1. Go to [sendgrid.com](https://sendgrid.com)
2. Create free account
3. Get your API key

### **Step 2: Update Function for SendGrid**
Replace the `sendEmail` function in the Supabase function with:

```typescript
async function sendEmail(to: string, subject: string, htmlContent: string, textContent: string) {
  if (!EMAIL_SERVICE_API_KEY) {
    throw new Error("Email service API key is missing")
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${EMAIL_SERVICE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: to }],
        },
      ],
      from: { email: EMAIL_FROM },
      subject: subject,
      content: [
        {
          type: "text/html",
          value: htmlContent,
        },
        {
          type: "text/plain",
          value: textContent,
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`SendGrid error: ${response.status} - ${error}`)
  }

  return await response.json()
}
```

### **Step 3: Set Environment Variables**
```bash
supabase secrets set EMAIL_SERVICE_API_KEY=SG.xxxxxxxxxxxx
supabase secrets set EMAIL_FROM=noreply@repute.cloud
supabase secrets set FRONTEND_URL=https://repute.cloud
```

## 🧪 **Test the Function**

After setting up, test with:

```javascript
console.log('Testing with email service...')

const authData = localStorage.getItem('sb-zyozeuihjptarceuipwu-auth-token')
const tokenData = JSON.parse(authData)
const accessToken = tokenData.access_token

fetch('https://zyozeuihjptarceuipwu.supabase.co/functions/v1/send_client_invitation', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    clientEmail: 'test@example.com',
    clientName: 'Test Client',
    trainerName: 'Test Trainer',
    trainerId: 'test-uuid',
    customMessage: 'This is a test invitation'
  })
}).then(response => {
  console.log('Test Status:', response.status)
  return response.text()
}).then(text => {
  console.log('Test Response:', text)
  
  try {
    const responseJson = JSON.parse(text)
    console.log('Parsed Response:', responseJson)
    
    if (responseJson.error) {
      console.error('Error:', responseJson.error)
    } else {
      console.log('SUCCESS! Function is working!')
    }
  } catch (e) {
    console.log('Response is not valid JSON')
  }
}).catch(e => console.error('Error:', e))
```

## 🎯 **Recommended: Resend**

**I recommend Resend because:**
- ✅ Simple setup (just API key)
- ✅ Good free tier (3,000 emails/month)
- ✅ No domain verification needed initially
- ✅ Good deliverability
- ✅ Modern API

**Would you like to try Resend first?** 