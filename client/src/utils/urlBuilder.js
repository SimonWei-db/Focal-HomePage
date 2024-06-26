const getFullUrl = (relativePath) => {
    if (!relativePath) {
      return `${process.env.REACT_APP_BACKEND_UPLOADS_URL}`;
    }
    //STANDALONE
    if (process.env.REACT_APP_ECE_STANDALONE === 'true') {
      if (relativePath.startsWith('./#/content-page?param=')) {
        return `${relativePath.substring(2)}`;
      }
      if (relativePath.startsWith('./upload_files/UserCloud'))
      return relativePath;
    }
  
    // 如果路径以 http 或 https 开头，直接返回原始路径
    if (process.env.REACT_APP_ECE_WEBSITE === 'true' || process.env.REACT_APP_BACKEND_UPLOADS_URL === '' || relativePath.startsWith('http://') || relativePath.startsWith('https://') || relativePath.startsWith('./#/content-page?param=') || relativePath.startsWith('/#/content-page?param=')) {
      return relativePath;
    }
    
  
    // 如果相对路径以 ./ 开头，去掉前缀
    if (relativePath.startsWith('./')) {
      relativePath = relativePath.substring(1);
    } else if (relativePath.startsWith('/')) {
      // 对于以 / 开头的路径，也可以直接处理
      
    } else {
      // 其他情况保持不变
      relativePath = `/${relativePath}`;
    }

    return `${process.env.REACT_APP_BACKEND_UPLOADS_URL}${relativePath}`;
  };
  
  export default getFullUrl;
  