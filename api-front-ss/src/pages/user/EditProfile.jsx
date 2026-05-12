import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './EditProfile.module.css';
import { FiArrowLeft, FiCamera } from 'react-icons/fi';
import AvatarPlaceholder from '../../assets/images/avatar.svg'; 

const EditProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: 'Аknur',
    last_name: 'Oraz',
    phone: '+7 706 666 77 77',
    email: 'aorazbai@gmail.com',
    avatar: null,
  });

  const handleBackClick = () => {
    navigate('/profile');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prevData) => ({
          ...prevData,
          avatar: reader.result, // Сохраняем превью аватарки
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://89.35.124.3:8080/api/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.status === 'profile updated') {
        alert('Профиль успешно обновлён');
        navigate('/profile');
      } else {
        alert('Ошибка обновления профиля');
      }
    } catch (error) {
      alert('Ошибка подключения к серверу');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={handleBackClick} className={styles.backButton}>
          <FiArrowLeft size={24} color="#fff" />
        </button>
        <h1 className={styles.title}>Изменить профиль</h1>
      </div>
      <div className={styles.avatarSection}>
        <div className={styles.avatarContainer}>
          <img
            src={formData.avatar || AvatarPlaceholder}
            alt="Аватар"
            className={styles.avatar}
          />
          <label htmlFor="avatar-upload" className={styles.avatarUploadButton}>
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
            <FiCamera size={20} color="#fff" />
          </label>
        </div>
      </div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="first_name">Имя</label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="last_name">Фамилия</label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="phone">Номер телефона</label>
          <input
            type="text"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="email">Электронная почта</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
          />
        </div>
        <button type="submit" className={styles.submitButton}>
          Сохранить изменения
        </button>
      </form>
    </div>
  );
};

export default EditProfile;
