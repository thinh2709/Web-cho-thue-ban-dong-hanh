(function () {
  function detectBase() {
    if (window.API_BASE) {
      return String(window.API_BASE).replace(/\/$/, '');
    }
    const { protocol, hostname, port } = window.location;
    const defaultApiPort = window.API_PORT || '3000';
    if (protocol === 'file:') {
      return `http://localhost:${defaultApiPort}/api`;
    }
    const p = port || '';
    const devPorts = ['5500', '8080', '5173', '4173', '3000', '5000'];
    const apiPort = devPorts.includes(p) ? defaultApiPort : p || defaultApiPort;
    return `${protocol}//${hostname}:${apiPort}/api`;
  }

  window.getApiBase = function getApiBase() {
    return detectBase();
  };
})();
