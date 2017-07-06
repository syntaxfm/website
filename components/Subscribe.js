import React from 'react';

export default ({ className, link, provider }) => {
  const slug = className || provider.replace(/\s/, '').toLowerCase();

  return (
    <li className={`subscribe__link subscribe__link--${slug}`}>
      <a href={link} target="_blank">{provider}</a>
    </li>
  );
};
