'use client';

import React, { useState, useEffect } from 'react';
import { Download, Layers, FolderDown, ExternalLink } from 'lucide-react';
import Prism from './components/Prism';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';

const AppleIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.63 1.35-.56.65-1.05 1.72-.92 2.74 1 .08 2.03-.49 2.62-1.24z"/>
  </svg>
);

const WindowsIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 5.45l6.5-.9v6.95H3V5.45zm0 7.85h6.5v6.95L3 19.35v-6.05zm7.8-8.98L21 2.7v8.8h-10.2V4.32zm10.2 8.98v8.8l-10.2-1.62v-7.18H21z"/>
  </svg>
);

const LinuxIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 640 640" fill="currentColor">
    <path d="M316.9 187.3C317.9 187.8 318.7 189 319.9 189C321 189 322.7 188.6 322.8 187.5C323 186.1 320.9 185.2 319.6 184.6C317.9 183.9 315.7 183.6 314.1 184.5C313.7 184.7 313.3 185.2 313.5 185.6C313.8 186.9 315.8 186.7 316.9 187.3zM295 189C296.2 189 297 187.8 298 187.3C299.1 186.7 301.1 186.9 301.5 185.7C301.7 185.3 301.3 184.8 300.9 184.6C299.3 183.7 297.1 184 295.4 184.7C294.1 185.3 292 186.2 292.2 187.6C292.3 188.6 294 189.1 295 189zM516 467.8C512.4 463.8 510.7 456.2 508.8 448.1C507 440 504.9 431.3 498.3 425.7C497 424.6 495.7 423.6 494.3 422.8C493 422 491.6 421.3 490.2 420.8C499.4 393.5 495.8 366.3 486.5 341.7C475.1 311.6 455.2 285.3 440 267.3C422.9 245.8 406.3 225.4 406.6 195.3C407.1 149.4 411.7 64.1 330.8 64C228.4 63.8 254 167.4 252.9 199.2C251.2 222.6 246.5 241 230.4 263.9C211.5 286.4 184.9 322.7 172.3 360.6C166.3 378.5 163.5 396.7 166.1 413.9C159.6 419.7 154.7 428.6 149.5 434.1C145.3 438.4 139.2 440 132.5 442.4C125.8 444.8 118.5 448.4 114 456.9C111.9 460.8 111.2 465 111.2 469.3C111.2 473.2 111.8 477.2 112.4 481.1C113.6 489.2 114.9 496.8 113.2 501.9C108 516.3 107.3 526.3 111 533.6C114.8 540.9 122.4 544.1 131.1 545.9C148.4 549.5 171.9 548.6 190.4 558.4C210.2 568.8 230.3 572.5 246.3 568.8C257.9 566.2 267.4 559.2 272.2 548.6C284.7 548.5 298.5 543.2 320.5 542C335.4 540.8 354.1 547.3 375.6 546.1C376.2 548.4 377 550.7 378.1 552.8L378.1 552.9C386.4 569.6 401.9 577.2 418.4 575.9C435 574.6 452.5 564.9 466.7 548C480.3 531.6 502.7 524.8 517.6 515.8C525 511.3 531 505.7 531.5 497.5C531.9 489.3 527.1 480.2 516 467.8zM319.8 151.3C329.6 129.1 354 129.5 363.8 150.9C370.3 165.1 367.4 181.8 359.5 191.3C357.9 190.5 353.6 188.7 346.9 186.4C348 185.2 350 183.7 350.8 181.8C355.6 170 350.6 154.8 341.7 154.5C334.4 154 327.8 165.3 329.9 177.5C325.8 175.5 320.5 174 316.9 173.1C315.9 166.2 316.6 158.5 319.8 151.3zM279.1 139.8C289.2 139.8 299.9 154 298.2 173.3C294.7 174.3 291.1 175.8 288 177.9C289.2 169 284.7 157.8 278.4 158.3C270 159 268.6 179.5 276.6 186.4C277.6 187.2 278.5 186.2 270.7 191.9C255.1 177.3 260.2 139.8 279.1 139.8zM265.5 200.5C271.7 195.9 279.1 190.5 279.6 190C284.3 185.6 293.1 175.8 307.5 175.8C314.6 175.8 323.1 178.1 333.4 184.7C339.7 188.8 344.7 189.1 356 194C364.4 197.5 369.7 203.7 366.5 212.2C363.9 219.3 355.5 226.6 343.8 230.3C332.7 233.9 324 246.3 305.6 245.2C301.7 245 298.6 244.2 296 243.1C288 239.6 283.8 232.7 276 228.1C267.4 223.3 262.8 217.7 261.3 212.8C259.9 207.9 261.3 203.8 265.5 200.5zM268.8 534.5C266.1 569.6 224.9 568.9 193.5 552.5C163.6 536.7 124.9 546 117 530.6C114.6 525.9 114.6 517.9 119.6 504.2L119.6 504C122 496.4 120.2 488 119 480.1C117.8 472.3 117.2 465.1 119.9 460.1C123.4 453.4 128.4 451 134.7 448.8C145 445.1 146.5 445.4 154.3 438.9C159.8 433.2 163.8 426 168.6 420.9C173.7 415.4 178.6 412.8 186.3 414C194.4 415.2 201.4 420.8 208.2 430L227.8 465.6C237.3 485.5 270.9 514 268.8 534.5zM267.4 508.6C263.3 502 257.8 495 253 489C260.1 489 267.2 486.8 269.7 480.1C272 473.9 269.7 465.2 262.3 455.2C248.8 437 224 422.7 224 422.7C210.5 414.3 202.9 404 199.4 392.8C195.9 381.6 196.4 369.5 199.1 357.6C204.3 334.7 217.7 312.4 226.3 298.4C228.6 296.7 227.1 301.6 217.6 319.2C209.1 335.3 193.2 372.5 215 401.6C215.6 380.9 220.5 359.8 228.8 340.1C240.8 312.7 266.1 265.2 268.1 227.4C269.2 228.2 272.7 230.6 274.3 231.5C278.9 234.2 282.4 238.2 286.9 241.8C299.3 251.8 315.4 251 329.3 243C335.5 239.5 340.5 235.5 345.2 234C355.1 230.9 363 225.4 367.5 219C375.2 249.4 393.2 293.3 404.7 314.7C410.8 326.1 423 350.2 428.3 379.3C431.6 379.2 435.3 379.7 439.2 380.7C453 345 427.5 306.5 415.9 295.8C411.2 291.2 411 289.2 413.3 289.3C425.9 300.5 442.5 323 448.5 348.3C451.3 359.9 451.8 372 448.9 384C465.3 390.8 484.8 401.9 479.6 418.8C477.4 418.7 476.4 418.8 475.4 418.8C478.6 408.7 471.5 401.2 452.6 392.7C433 384.1 416.6 384.1 414.3 405.2C402.2 409.4 396 419.9 392.9 432.5C390.1 443.7 389.3 457.2 388.5 472.4C388 480.1 384.9 490.4 381.7 501.4C349.6 524.3 305 534.3 267.4 508.6zM524.8 497.1C523.9 513.9 483.6 517 461.6 543.6C448.4 559.3 432.2 568 418 569.1C403.8 570.2 391.5 564.3 384.3 549.8C379.6 538.7 381.9 526.7 385.4 513.5C389.1 499.3 394.6 484.7 395.3 472.9C396.1 457.7 397 444.4 399.5 434.2C402.1 423.9 406.1 417 413.2 413.1C413.5 412.9 413.9 412.8 414.2 412.6C415 425.8 421.5 439.2 433 442.1C445.6 445.4 463.7 434.6 471.4 425.8C480.4 425.5 487.1 424.9 494 430.9C503.9 439.4 501.1 461.2 511.1 472.5C521.7 484.1 525.1 492 524.8 497.1zM269.4 212.7C271.4 214.6 274.1 217.2 277.4 219.8C284 225 293.2 230.4 304.7 230.4C316.3 230.4 327.2 224.5 336.5 219.6C341.4 217 347.4 212.6 351.3 209.2C355.2 205.8 357.2 202.9 354.4 202.6C351.6 202.3 351.8 205.2 348.4 207.7C344 210.9 338.7 215.1 334.5 217.5C327.1 221.7 315 227.7 304.6 227.7C294.2 227.7 285.9 222.9 279.7 218C276.6 215.5 274 213 272 211.1C270.5 209.7 270.1 206.5 267.7 206.2C266.3 206.1 265.9 209.9 269.4 212.7z"/></svg>
);

const GithubIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

const AppleSpinner = ({ size = 11 }: { size?: number }) => (
  <svg
    className="apple-spinner"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <rect x="11" y="1" width="2" height="5" rx="1" opacity="0.08" />
    <rect x="11" y="1" width="2" height="5" rx="1" transform="rotate(30 12 12)" opacity="0.16" />
    <rect x="11" y="1" width="2" height="5" rx="1" transform="rotate(60 12 12)" opacity="0.24" />
    <rect x="11" y="1" width="2" height="5" rx="1" transform="rotate(90 12 12)" opacity="0.32" />
    <rect x="11" y="1" width="2" height="5" rx="1" transform="rotate(120 12 12)" opacity="0.4" />
    <rect x="11" y="1" width="2" height="5" rx="1" transform="rotate(150 12 12)" opacity="0.48" />
    <rect x="11" y="1" width="2" height="5" rx="1" transform="rotate(180 12 12)" opacity="0.56" />
    <rect x="11" y="1" width="2" height="5" rx="1" transform="rotate(210 12 12)" opacity="0.64" />
    <rect x="11" y="1" width="2" height="5" rx="1" transform="rotate(240 12 12)" opacity="0.72" />
    <rect x="11" y="1" width="2" height="5" rx="1" transform="rotate(270 12 12)" opacity="0.8" />
    <rect x="11" y="1" width="2" height="5" rx="1" transform="rotate(300 12 12)" opacity="0.9" />
    <rect x="11" y="1" width="2" height="5" rx="1" transform="rotate(330 12 12)" opacity="1" />
  </svg>
);

const StarIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#eab308" stroke="#eab308" strokeWidth="1">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'macos' | 'windows' | 'linux'>('macos');
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    fetch('https://api.github.com/repos/lunoxd/Azure-Bicep-Builder')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.stargazers_count === 'number') {
          setStars(data.stargazers_count);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="landing-container">
      {/* Floating Pill Navigation */}
      <header className="landing-nav-wrapper">
        <nav className="landing-nav">
          <a href="#" className="nav-brand">
            <div className="nav-logo-icon">
              <Layers size={18} strokeWidth={2.2} />
            </div>
            <span className="nav-brand-title">Azure Bicep Builder</span>
          </a>

          <div className="nav-links">
            <a
              href="https://github.com/lunoxd/Azure-Bicep-Builder"
              target="_blank"
              rel="noreferrer"
              className="nav-github-btn"
            >
              <GithubIcon size={16} />
              <span>GitHub</span>
              <span className="nav-github-stars">
                <StarIcon size={11} />
                {stars !== null ? (
                  <span>{stars}</span>
                ) : (
                  <AppleSpinner size={11} />
                )}
              </span>
            </a>

            <a href="#downloads" className="btn-nav-download">
              Download App
            </a>
          </div>
        </nav>
      </header>

      {/* Hero Section with 3D WebGL Prism */}
      <div className="hero-wrapper">
        <div className="hero-prism-bg">
          <Prism
            animationType="hover"
            timeScale={0.5}
            height={3.5}
            baseWidth={5.5}
            scale={3.6}
            hueShift={0}
            colorFrequency={1}
            noise={0}
            glow={1.1}
            bloom={1.1}
            hoverStrength={2}
            transparent={true}
          />
        </div>

        <section className="hero">
          <div className="hero-content">
            <h1 className="hero-title">
              Visual Infrastructure Builder<br />
              <span className="hero-title-gradient">Engineered for Azure Bicep</span>
            </h1>

            <p className="hero-subtitle">
              Design cloud topologies visually, auto-generate production-grade Bicep code with zero drift,
              and deploy directly to Microsoft Azure in real-time.
            </p>

            {/* Download Group using shadcn Tabs */}
            <div className="download-group-container" id="downloads">
              <Tabs defaultValue="macos" value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList style={{ margin: '0 auto 20px', display: 'flex', justifyContent: 'center' }}>
                  <TabsTrigger value="macos">
                    <AppleIcon size={15} /> macOS
                  </TabsTrigger>
                  <TabsTrigger value="windows">
                    <WindowsIcon size={15} /> Windows
                  </TabsTrigger>
                  <TabsTrigger value="linux">
                    <LinuxIcon size={15} /> Linux / Source
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="macos">
                  <div className="download-cards-grid">
                    <a
                      href="/downloads/Azure-Bicep-Builder-macOS.dmg"
                      download
                      className="btn-download-primary"
                    >
                      <AppleIcon size={18} /> Download macOS .DMG (4.1 MB)
                    </a>
                    <a
                      href="/downloads/Azure-Bicep-Builder-macOS.zip"
                      download
                      className="btn-download-secondary"
                    >
                      <FolderDown size={18} /> Download macOS .ZIP (3.9 MB)
                    </a>
                  </div>
                </TabsContent>

                <TabsContent value="windows">
                  <div className="download-cards-grid">
                    <a
                      href="https://github.com/lunoxd/Azure-Bicep-Builder/releases"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-download-primary"
                    >
                      <WindowsIcon size={18} /> Windows 64-bit Installer (.exe)
                    </a>
                    <a
                      href="https://github.com/lunoxd/Azure-Bicep-Builder/releases"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-download-secondary"
                    >
                      <ExternalLink size={16} /> GitHub Windows Releases
                    </a>
                  </div>
                </TabsContent>

                <TabsContent value="linux">
                  <div className="download-cards-grid">
                    <a
                      href="https://github.com/lunoxd/Azure-Bicep-Builder/releases"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-download-primary"
                    >
                      <LinuxIcon size={18} /> Linux .AppImage / .deb
                    </a>
                    <a
                      href="https://github.com/lunoxd/Azure-Bicep-Builder"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-download-secondary"
                    >
                      <GithubIcon size={16} /> Build from Source (Cargo + Vite)
                    </a>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
