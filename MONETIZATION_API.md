# Resizer API - Monetization System Documentation

## 🎯 Complete Subscription & Quota System

Your Resizer app now has a complete **Stripe-integrated subscription system** with quota enforcement. Here's everything built:

---

## 📊 Pricing Tiers

| Plan | Price | Images/Month | Features |
|------|-------|-------------|----------|
| **Free** | $0 | 5 | Basic compression, WebP only |
| **Pro** | $9.99 | 500 | All formats, watermark removal, priority support |
| **Business** | $49.99 | ∞ | Unlimited, API access, dedicated support |

---

## 🔌 New API Endpoints

### **1. Subscription Management**

#### Get Current Subscription
```
GET /api/subscription/current
Headers: Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "subscription": {
    "user_id": "usr_user_001",
    "plan_id": "free",
    "status": "active",
    "current_period_end": "2026-09-03T..."
  },
  "plan": {
    "name": "Free",
    "price": 0,
    "imagesPerMonth": 5,
    "features": ["Basic compression", "Max 5 images/month"]
  },
  "usage": {
    "current": 2,
    "limit": 5,
    "remaining": 3,
    "resetDate": "2026-09-03T..."
  }
}
```

#### Get All Pricing Plans
```
GET /api/subscription/plans

Response:
{
  "success": true,
  "plans": {
    "free": { ... },
    "pro": { ... },
    "business": { ... }
  }
}
```

#### Create Checkout Session (Upgrade to Pro/Business)
```
POST /api/subscription/checkout
Headers: Authorization: Bearer {jwt_token}
Body: {
  "planId": "pro"  // or "business"
}

Response:
{
  "success": true,
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_...",
  "sessionId": "cs_test_..."
}
```

#### Upgrade Subscription
```
PATCH /api/subscription/upgrade
Headers: Authorization: Bearer {jwt_token}
Body: {
  "newPlanId": "business"
}

Response:
{
  "success": true,
  "stripePriceId": "price_business_123",
  "plan": { ... },
  "action": "checkout"  // or "portal"
}
```

#### Cancel Subscription (Downgrade to Free)
```
DELETE /api/subscription/cancel
Headers: Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "message": "Subscription canceled. You have been downgraded to Free plan."
}
```

#### Get Stripe Customer Portal
```
GET /api/subscription/portal
Headers: Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "portalUrl": "https://billing.stripe.com/..."
}
```

#### Stripe Webhook (For Backend Only)
```
POST /api/subscription/webhook
Headers: stripe-signature: {signature}
Body: Raw Stripe event

Response:
{
  "received": true
}
```

---

## 🔒 Image Processing with Quota

### Updated Image Processing Endpoints

#### Process Single Image
```
POST /api/images/process
Headers: 
  - Authorization: Bearer {jwt_token}
  - Content-Type: multipart/form-data

Body: {
  image: <file>,
  width: 800,
  height: 600,
  format: "webp",
  quality: 80
}

Response (if quota exceeded):
{
  "success": false,
  "error": "Quota exceeded",
  "message": "You have reached your limit of 5 images per month. Upgrade to continue.",
  "quotaInfo": {
    "allowed": false,
    "remaining": 0,
    "plan": "free",
    "limit": 5,
    "usage": 5,
    "resetDate": "2026-09-03T..."
  }
}

Response (if successful):
{
  "success": true,
  "filename": "image_resized.webp",
  "contentType": "image/webp",
  "originalSizeBytes": 2048000,
  "outputSizeBytes": 512000,
  "savingsPercent": 75,
  ...
}
```

#### Batch Process Images
```
POST /api/images/batch
Headers: Authorization: Bearer {jwt_token}
Body: {
  images: [<file1>, <file2>, ...],
  format: "webp",
  quality: 80
}

// Same quota enforcement as single image
```

---

## 📈 How It Works

### **Free Tier Flow:**
1. User registers → Automatically gets Free subscription (5 images/month)
2. Tries to process image → Quota check happens
3. If ≤ 5 images this month → Process succeeds
4. If > 5 images → Error response with upgrade CTA
5. User clicks upgrade → Redirected to Stripe checkout

### **Paid Tier Flow:**
1. User subscribes to Pro/Business
2. Stripe creates subscription
3. Webhook fires → DB updated with `stripe_subscription_id`
4. User can now process unlimited (Pro) or unlimited (Business) images
5. To downgrade → Cancel endpoint reverts to Free

### **Quota Reset:**
- Monthly quota resets based on `current_period_end` from Stripe
- Tracked in database per-user

---

## 💻 Frontend Integration Example

### **React Component Example**
```javascript
// Get current subscription
const getSubscription = async () => {
  const res = await fetch('/api/subscription/current', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
};

// Upgrade to Pro
const upgradeToP ro = async () => {
  const res = await fetch('/api/subscription/checkout', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ planId: 'pro' })
  });
  const data = await res.json();
  window.location.href = data.checkoutUrl; // Redirect to Stripe
};

// Process image with quota check
const processImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  
  const res = await fetch('/api/images/process', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  if (res.status === 429) {
    // Quota exceeded
    const data = await res.json();
    alert(`Quota exceeded! Upgrade to continue. Plan: ${data.quotaInfo.plan}`);
    return;
  }
  
  return res.json();
};
```

---

## 🔑 Environment Variables Required

Add to `.env`:
```
# Stripe Configuration
STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_WEBHOOK_SECRET
STRIPE_PRICE_PRO=price_YOUR_PRO_PRICE_ID
STRIPE_PRICE_BUSINESS=price_YOUR_BUSINESS_PRICE_ID

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

---

## 📊 Database Schema

### **subscriptions table**
```sql
CREATE TABLE subscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(191) UNIQUE,
  plan_id ENUM('free', 'pro', 'business'),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  status ENUM('active', 'past_due', 'canceled'),
  current_period_start DATETIME,
  current_period_end DATETIME,
  last_payment_date DATETIME,
  created_at TIMESTAMP
);
```

---

## 🚀 Testing Stripe Locally

### **Using Stripe CLI:**
```bash
# Install Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Windows: choco install stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:5001/api/subscription/webhook

# Use test card numbers
# 4242 4242 4242 4242 (success)
# 4000 0000 0000 0002 (declined)
```

---

## 💰 Revenue Calculation

**Example Scenario:**
- 10,000 free users
- 200 convert to Pro ($9.99/month) = $1,998/month
- 50 convert to Business ($49.99/month) = $2,499/month
- **Total: $4,497/month MRR**

Plus:
- Ads on free tier ($2-5 CPM)
- API sales ($0.01 per 100 calls)
- Referral commissions

---

## 🔄 Next Steps to Make Money

1. ✅ **Stripe integration done**
2. **Add Google AdSense** for free users
3. **Implement referral program** (5% commission)
4. **Create admin dashboard** to track revenue
5. **Setup email notifications** for failed payments
6. **Launch affiliate program** for agencies
7. **Build API marketplace** for developers

---

## ⚡ Test It Now

1. Register a new user: `POST /api/auth/register`
2. Get subscription: `GET /api/subscription/current` 
3. Try processing 6 images → 6th should fail with quota error
4. Upgrade to Pro: `POST /api/subscription/checkout`
5. Complete Stripe payment with test card `4242 4242 4242 4242`
6. Process 500+ images → All succeed

---

Your app is now **monetized and ready to make money!** 🎉
