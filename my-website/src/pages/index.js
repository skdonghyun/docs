import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';
import SearchBar from '@theme/SearchBar';

const systems = {
  internal: [
    { id: 1, name: '사내 시스템 1', icon: '🏢' },
    { id: 2, name: '사내 시스템 2', icon: '📊' },
    { id: 3, name: '사내 시스템 3', icon: '💼' },
    { id: 4, name: '사내 시스템 4', icon: '📅' },
  ],
  external: [
    { id: 5, name: '사외 시스템 1', icon: '🌐' },
    { id: 6, name: '사외 시스템 2', icon: '🔗' },
    { id: 7, name: '사외 시스템 3', icon: '📡' },
  ],
};

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();

  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <h1 className={styles.title}>{siteConfig.title}</h1>
        <p className={styles.subtitle}>{siteConfig.tagline}</p>
        <div className={styles.searchContainer}>
          <SearchBar />
        </div>
      </div>
    </header>
  );
}

function SystemGrid({title, systems}) {
  return (
    <div className={styles.systemSection}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.systemGrid}>
        {systems.map((system) => (
          <Link to={`/docs/system${system.id}`} key={system.id} className={styles.systemCard}>
            <div className={styles.systemIcon}>{system.icon}</div>
            <h3 className={styles.systemName}>{system.name}</h3>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Layout
      title="홈"
      description="시스템 매뉴얼 메인 페이지">
      <HomepageHeader />
      <main className={styles.main}>
        <SystemGrid title="사내 시스템" systems={systems.internal} />
        <SystemGrid title="사외 시스템" systems={systems.external} />
      </main>
    </Layout>
  );
}