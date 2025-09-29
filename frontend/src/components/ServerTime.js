import React, { useState, useEffect } from 'react';
import { generalAPI } from '../services/api';

const ServerTime = ({ className = '' }) => {
  const [serverTime, setServerTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localTime, setLocalTime] = useState(new Date().toISOString());

  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        setLoading(true);
        const response = await generalAPI.getServerTime();
        setServerTime(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch server time');
        console.error('Error fetching server time:', err);
      } finally {
        setLoading(false);
      }
    };

    // Fetch server time initially
    fetchServerTime();

    // Update local time every second
    const localTimeInterval = setInterval(() => {
      setLocalTime(new Date().toISOString());
    }, 1000);

    // Fetch server time every 30 seconds to keep it synchronized
    const serverTimeInterval = setInterval(fetchServerTime, 30000);

    return () => {
      clearInterval(localTimeInterval);
      clearInterval(serverTimeInterval);
    };
  }, []);

  if (loading) {
    return (
      <div className={`server-time ${className}`}>
        <div className="time-loading">Loading server time...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`server-time ${className}`}>
        <div className="time-error" style={{ color: '#ef4444' }}>
          {error}
        </div>
      </div>
    );
  }

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const getTimeDifference = () => {
    if (!serverTime) return null;
    
    const serverTimestamp = new Date(serverTime.serverTime).getTime();
    const localTimestamp = new Date(localTime).getTime();
    const diff = Math.abs(serverTimestamp - localTimestamp);
    
    if (diff < 1000) return 'Synchronized';
    if (diff < 60000) return `${Math.round(diff / 1000)}s difference`;
    return `${Math.round(diff / 60000)}m difference`;
  };

  return (
    <div className={`server-time ${className}`} style={{ 
      fontSize: '0.875rem',
      color: '#6b7280',
      fontFamily: 'monospace'
    }}>
      <div className="time-info">
        <div className="server-time-display">
          <strong>Server:</strong> {serverTime ? formatTime(serverTime.serverTime) : 'N/A'}
        </div>
        <div className="local-time-display">
          <strong>Local:</strong> {formatTime(localTime)}
        </div>
        {serverTime && (
          <div className="time-sync">
            <strong>Sync:</strong> {getTimeDifference()}
          </div>
        )}
        {serverTime?.timezone && (
          <div className="timezone">
            <strong>Server TZ:</strong> {serverTime.timezone}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServerTime;