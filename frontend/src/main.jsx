import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#2c2c2c', borderRadius: 6 } }}>
      <App />
    </ConfigProvider>
  </BrowserRouter>
);
