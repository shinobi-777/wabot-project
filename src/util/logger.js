function logInfo(message) {
    console.log(`[INFO] ${message}`);
  }
  
  function logError(message, error) {
    console.error(`[ERROR] ${message}`, error);
  }
  
  module.exports = { logInfo, logError };
  