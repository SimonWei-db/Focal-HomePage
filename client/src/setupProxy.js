const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8081/api',
      changeOrigin: true,
      onError: (err, req, res) => {
        console.log('Proxy error:', err.message); // 打印代理错误
        res.writeHead(500, {
          'Content-Type': 'text/plain'
        });
        res.end('Something went wrong.');
      }
    })
  );
  app.use(
    '/uploads',
    createProxyMiddleware({
      target: 'http://localhost:8081/uploads',
      changeOrigin: true,
      onError: (err, req, res) => {
        console.log('Proxy error:', err.message); // 打印代理错误
        res.writeHead(500, {
          'Content-Type': 'text/plain'
        });
        res.end('Something went wrong.');
      }
    })
  );
};
