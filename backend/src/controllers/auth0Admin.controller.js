const auth0Admin = require('../services/auth0Admin.service');

function wrap(handler) {
  return async (req, res) => {
    try {
      return await handler(req, res);
    } catch (error) {
      if (error.code === 'NOT_CONFIGURED') {
        return res.status(200).json({ configured: false, hint: error.message });
      }
      if (error.code === 'BAD_REQUEST') {
        return res.status(400).json({ success: false, error: error.message });
      }
      if (error.code === 'UPSTREAM_UNREACHABLE') {
        return res.status(502).json({ success: false, error: error.message });
      }
      if (error.code === 'UPSTREAM_ERROR') {
        return res.status(502).json({ success: false, error: error.message });
      }
      console.error('[Auth0 admin]', error.message);
      return res.status(500).json({ success: false, error: 'Auth0 administration request failed.' });
    }
  };
}

const handleStatus = wrap(async (req, res) => res.json(auth0Admin.getStatus()));

const handleListUsers = wrap(async (req, res) => {
  const users = await auth0Admin.listUsers({
    page: req.query.page,
    perPage: req.query.per_page,
    search: req.query.q,
  });
  return res.json({ success: true, users });
});

const handleGetUser = wrap(async (req, res) => {
  const user = await auth0Admin.getUser(req.params.id);
  return res.json({ success: true, user });
});

module.exports = {
  handleStatus,
  handleListUsers,
  handleGetUser,
};
