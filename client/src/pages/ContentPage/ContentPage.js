import React, { useState, useEffect } from 'react';
import { Layout, Card, Spin } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import CustomFooter from '../../components/layout/CustomFooter';
import pageService from '../../services/pageService'; // 假设这是获取页面数据的服务
import './ContentPage.css';
import JSON5 from 'json5'; // 引入 JSON5 库，如果需要

const { Header, Content } = Layout;

const guessLanguage = (code) => {
  const keywords = {
    markup: ['<!DOCTYPE html>', '<html>', '<head>', '<body>', '</html>', '</head>', '</body>', '<div', '<span', '<a', '<img'],
    css: ['color', 'background', 'font-size', 'margin', 'padding', 'display', 'position', 'border', 'width', 'height'],
    clike: ['#include', '#define', 'int', 'float', 'double', 'char', 'main', 'if', 'else'],
    javascript: ['function', 'const', 'let', 'var', '=>', 'document', 'console', 'alert', 'for', 'while'],
    c: ['#include', '#define', 'int', 'float', 'double', 'char', 'main', 'printf', 'scanf'],
    csharp: ['using', 'namespace', 'class', 'void', 'int', 'public', 'private', 'static', 'new', 'Console'],
    cpp: ['#include', 'using namespace', 'std::', 'cout', 'cin', 'int', 'float', 'double', 'char', 'main'],
    go: ['package', 'import', 'func', 'main', 'fmt', 'var', 'const', 'struct', 'interface'],
    java: ['public', 'class', 'void', 'static', 'int', 'import', 'new', 'System.out.println', 'String', 'extends'],
    matlab: ['plot', 'disp', 'xlabel', 'ylabel', 'title', 'figure', 'subplot', 'hold on', 'legend', 'grid'],
    python: ['def', 'import', 'as', 'print', 'self', 'class', 'if', 'elif', 'else', 'for', 'while', 'try', 'except'],
    sql: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'JOIN', 'ON', 'CREATE', 'DROP', 'ALTER', 'TABLE'],
  };

  const scores = {};

  // 初始化每种语言的得分为0
  for (const lang in keywords) {
    scores[lang] = 0;
  }

  // 计算每种语言关键字在代码块中出现的次数
  for (const [lang, kwds] of Object.entries(keywords)) {
    for (const kw of kwds) {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      const matches = code.match(regex);
      if (matches) {
        scores[lang] += matches.length;
      }
    }
  }

  // 使用 try-catch 检测 JSON 和 JSON5 格式
  try {
    JSON.parse(code);
    return 'language-json';
  } catch (e) {
    // 不是 JSON 格式，继续检查其他语言
  }

  try {
    JSON5.parse(code);
    return 'language-json5';
  } catch (e) {
    // 不是 JSON5 格式，继续检查其他语言
  }

  // 找出得分最高的语言
  let maxScore = 0;
  let detectedLanguage = 'plaintext';

  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedLanguage = lang;
    }
  }

  return `language-${detectedLanguage}`;
};

const ContentPage = () => {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const param = params.get('param');
    if (param) {
      fetchPageData(param);
    } else {
      setLoading(false);
      navigate('/NotFound');
    }
  }, [location, navigate]);

  useEffect(() => {
    if (window.Prism) {
      const preBlocks = document.querySelectorAll('pre.ql-syntax');
      preBlocks.forEach((block) => {
        if (!block.querySelector('code')) {
          const code = document.createElement('code');
          const detectedLanguage = guessLanguage(block.textContent);
          code.className = detectedLanguage;
          code.innerHTML = block.innerHTML;
          block.innerHTML = '';
          block.appendChild(code);
        }
      });
      window.Prism.highlightAll(); // 高亮显示所有代码块
    }
  }, [pageData]);

  const fetchPageData = async (param) => {
    setLoading(true);
    try {
      let response;
      if (process.env.REACT_APP_ECE_WEBSITE === 'true') {
        const fetchResponse = await fetch(`${process.env.PUBLIC_URL}/upload_files/WebPages/${param}.json?timestamp=${new Date().getTime()}`);
        if (!fetchResponse.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await fetchResponse.json();
        response = { success: true, page: data };
      } else {
        response = await pageService.getPageByParamService(param);
      }

      if (response.success) {
        setPageData(response.page);
      } else {
        navigate('/NotFound');
      }
    } catch (error) {
      navigate('/NotFound');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout className="layout">
      <Header className="header">
        <Navbar />
      </Header>
      <Content style={{ padding: '0' }}>
        <div className="content-page-background">
          <div className="content-page-overlay"></div>
        </div>
        <Spin spinning={loading} tip="Loading..." style={{ marginTop: '50px' }}>
          {pageData && (
            <div className="content-page">
              <Card className="content-card">
                <h1 className="page-title">{pageData.title}</h1>
                <p className="update-time">Updated at: {new Date(pageData.updated_at).toLocaleString()}</p>
                <div
                  className="content-body"
                  dangerouslySetInnerHTML={{ __html: pageData.content }}
                />
              </Card>
            </div>
          )}
        </Spin>
      </Content>
      <CustomFooter />
    </Layout>
  );
};

export default ContentPage;
