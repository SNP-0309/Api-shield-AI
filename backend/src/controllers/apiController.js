export const apiController = {
  ping(req, res) {
    res.json({
      status: 'success',
      message: 'Protected API route is reachable',
      requestId: req.requestId,
      sentinel: req.sentinel
    });
  }
};
