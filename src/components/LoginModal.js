import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import Icon from './Icons';

export default function LoginModal({ onClose }) {
  const { handleLogin } = useMusic();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    const result = handleLogin(form);
    if (result.error) {
      setError(result.error);
    } else {
      setError('');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="login-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}><Icon name="x" size={20} /></button>
        <div className="login-logo"><Icon name="music" size={36} /></div>
        <h1>悦动音乐</h1>
        <p className="login-subtitle">发现你的音乐世界</p>
        <input
          type="text"
          placeholder="用户名"
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
          autoFocus
        />
        <input
          type="password"
          placeholder="密码"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
        {error && <div className="login-error">{error}</div>}
        <button type="submit" className="btn-login" onClick={onSubmit}>登 录</button>
        <p className="login-hint">任意输入即可登录，无需注册</p>
      </div>
    </div>
  );
}
