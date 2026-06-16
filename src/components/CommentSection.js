import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMusic } from '../context/MusicContext';
import { getSeedComments } from '../data/seedComments';
import Icon from './Icons';

const COMMENTS_STORAGE_KEY = 'qqmusic_comments';

/**
 * Load all comments from localStorage.
 * Returns a Map: songId -> comment[]
 */
function loadAllComments() {
  try {
    const raw = localStorage.getItem(COMMENTS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Save all comments to localStorage.
 */
function saveAllComments(commentsMap) {
  localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(commentsMap));
}

/**
 * Ensure seed comments exist for a song if no comments have been created yet.
 */
function ensureSeedComments(songId, songIndex) {
  const all = loadAllComments();
  if (all[songId] && all[songId].length > 0) return all;
  const seeds = getSeedComments(songIndex);
  if (seeds.length > 0) {
    all[songId] = seeds;
    saveAllComments(all);
  }
  return all;
}

function formatTimestamp(ts) {
  const date = new Date(ts);
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function CommentSection({ currentSong, onLoginClick }) {
  const { user } = useMusic();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sortOrder, setSortOrder] = useState('latest'); // 'latest' | 'popular'

  // Song index for seed comments (parse from "prebuilt-{index}" ID)
  const songIndex = currentSong?.id?.startsWith('prebuilt-')
    ? parseInt(currentSong.id.replace('prebuilt-', ''), 10)
    : -1;

  // Load comments for current song
  useEffect(() => {
    if (!currentSong) {
      setComments([]);
      return;
    }
    let all = loadAllComments();
    // Seed on first load
    if (songIndex >= 0) {
      all = ensureSeedComments(currentSong.id, songIndex);
    }
    setComments(all[currentSong.id] || []);
  }, [currentSong, songIndex]);

  // Persist comments whenever they change (skip initial seed load)
  const commentsRef = React.useRef(comments);
  useEffect(() => {
    if (!currentSong) return;
    // Only save if comments actually changed from what's in storage
    const all = loadAllComments();
    const prev = JSON.stringify(all[currentSong.id] || []);
    const next = JSON.stringify(comments);
    if (prev !== next) {
      all[currentSong.id] = comments;
      saveAllComments(all);
    }
    commentsRef.current = comments;
  }, [comments, currentSong]);

  const handleSubmit = useCallback(() => {
    if (!newComment.trim() || !user || submitting) return;
    setSubmitting(true);
    const comment = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      songId: currentSong.id,
      username: user.username,
      content: newComment.trim(),
      timestamp: Date.now(),
      likes: 0,
    };
    setComments(prev => [comment, ...prev]);
    setNewComment('');
    setSubmitting(false);
  }, [newComment, user, currentSong, submitting]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDelete = (commentId) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleLike = (commentId) => {
    setComments(prev => prev.map(c =>
      c.id === commentId ? { ...c, likes: c.likes + 1 } : c
    ));
  };

  // Sort comments
  const sortedComments = [...comments].sort((a, b) => {
    if (sortOrder === 'popular') return b.likes - a.likes;
    return b.timestamp - a.timestamp;
  });

  if (!currentSong) {
    return (
      <div className="comment-empty">
        <div className="comment-empty-icon"><Icon name="comment" size={36} /></div>
        <p>请选择一首歌曲查看评论</p>
      </div>
    );
  }

  return (
    <div className="comment-section">
      {/* Header */}
      <div className="comment-header">
        <h4><Icon name="comment" size={18} /> 评论</h4>
        <div className="comment-header-right">
          <span className="comment-count">{comments.length} 条</span>
          <div className="comment-sort">
            <button
              className={`comment-sort-btn ${sortOrder === 'latest' ? 'active' : ''}`}
              onClick={() => setSortOrder('latest')}
            >
              最新
            </button>
            <button
              className={`comment-sort-btn ${sortOrder === 'popular' ? 'active' : ''}`}
              onClick={() => setSortOrder('popular')}
            >
              最热
            </button>
          </div>
        </div>
      </div>

      {/* Input area */}
      {user ? (
        <div className="comment-input-area">
          <div className="comment-input-avatar">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="comment-input-wrap">
            <textarea
              className="comment-input"
              placeholder="写下你的评论..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              maxLength={500}
            />
            <div className="comment-input-bottom">
              <span className="comment-input-count">
                {newComment.length}/500
              </span>
              <motion.button
                className="comment-submit-btn"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleSubmit}
                disabled={!newComment.trim() || submitting}
              >
                发表评论
              </motion.button>
            </div>
          </div>
        </div>
      ) : (
        <div className="comment-login-prompt">
          <div className="comment-login-icon"><Icon name="lock" size={32} /></div>
          <p>登录后即可发表评论</p>
          <motion.button
            className="comment-login-btn"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onLoginClick}
          >
            立即登录
          </motion.button>
        </div>
      )}

      {/* Comment list */}
      {sortedComments.length === 0 ? (
        <div className="comment-empty-list">
          <div className="comment-empty-icon"><Icon name="empty" size={36} /></div>
          <p>暂无评论，来发表第一条评论吧</p>
        </div>
      ) : (
        <div className="comment-list">
          <AnimatePresence>
            {sortedComments.map((comment) => (
              <motion.div
                key={comment.id}
                className="comment-item"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="comment-avatar">
                  {comment.username.charAt(0).toUpperCase()}
                </div>
                <div className="comment-body">
                  <div className="comment-top">
                    <span className="comment-username">{comment.username}</span>
                    <span className="comment-time">{formatTimestamp(comment.timestamp)}</span>
                  </div>
                  <div className="comment-content">{comment.content}</div>
                  <div className="comment-actions">
                    <button
                      className="comment-like-btn"
                      onClick={() => handleLike(comment.id)}
                      title="赞"
                    >
                      <Icon name="thumbs-up" size={14} />
                      {comment.likes > 0 && <span>{comment.likes}</span>}
                    </button>
                    {user && user.username === comment.username && (
                      <button
                        className="comment-delete-btn"
                        onClick={() => handleDelete(comment.id)}
                        title="删除"
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
