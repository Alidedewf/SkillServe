// src/components/OrderCircle.jsx
import React from 'react';
import styles from './OrderCircle.module.css';

const OrderCircle = ({ order }) => {
  return <div className={styles.circle}>{order < 10 ? `0${order}` : order}</div>;
};

export default OrderCircle;
