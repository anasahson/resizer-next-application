const contactService = require('../services/contact.service');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function textField(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function handleSubmit(req, res) {
  try {
    const subject = textField(req.body?.subject);
    const message = textField(req.body?.message);

    if (!subject || subject.length > 160) {
      return res.status(400).json({ success: false, message: 'Add a subject of 160 characters or fewer.' });
    }
    if (!message || message.length > 3000) {
      return res.status(400).json({ success: false, message: 'Add a message of 3,000 characters or fewer.' });
    }

    let userId = null;
    let name = textField(req.body?.name);
    let email = textField(req.body?.email).toLowerCase();

    if (req.user?.id) {
      const account = await contactService.getSubmitter(req.user.id);
      if (!account?.email) {
        return res.status(401).json({ success: false, message: 'Your session is no longer valid. Please sign in again.' });
      }
      userId = req.user.id;
      name = textField(account.name) || account.email;
      email = textField(account.email).toLowerCase();
    } else if (!name || name.length > 120 || !EMAIL_PATTERN.test(email) || email.length > 254) {
      return res.status(400).json({ success: false, message: 'Enter a name and valid email address.' });
    }

    if (req.user?.id && (!EMAIL_PATTERN.test(email) || email.length > 254)) {
      return res.status(400).json({ success: false, message: 'The account email address is invalid.' });
    }

    const id = await contactService.createSubmission({ userId, name, email, subject, message });
    return res.status(201).json({
      success: true,
      message: 'Your message has been sent. Our support team will get back to you.',
      id,
    });
  } catch (error) {
    console.error('[Contact submission]', error.message);
    return res.status(500).json({ success: false, message: 'Unable to send your message right now.' });
  }
}

async function handleAdminList(req, res) {
  try {
    const limitValue = Number(req.query.limit || 25);
    const limit = Number.isInteger(limitValue) ? Math.min(Math.max(limitValue, 1), 50) : 25;
    let cursor = null;

    if (req.query.cursor !== undefined) {
      if (!/^\d+$/.test(String(req.query.cursor))) {
        return res.status(400).json({ success: false, message: 'Invalid contact inbox cursor.' });
      }
      cursor = Number(req.query.cursor);
      if (!Number.isSafeInteger(cursor) || cursor < 1) {
        return res.status(400).json({ success: false, message: 'Invalid contact inbox cursor.' });
      }
    }

    const data = await contactService.listSubmissions({ cursor, limit });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[Admin contact inbox]', error.message);
    return res.status(500).json({ success: false, message: 'Unable to load contact submissions.' });
  }
}

module.exports = { handleSubmit, handleAdminList };
