import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <select 
      onChange={changeLanguage} 
      value={i18n.language.split('-')[0]}
      className="select select-bordered select-sm focus:select-primary"
    >
      <option value="es">Español</option>
      <option value="en">English</option>
    </select>
  );
};

export default LanguageSelector;
