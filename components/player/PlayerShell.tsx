'use client'

import Image from 'next/image'
import { useAppBootstrap } from '@/lib/client/hooks/useAppBootstrap'
import { avatarSrc, sourceLabels, useImmersivePlayer, waveformHeights } from '@/lib/client/hooks/useImmersivePlayer'

const rates = [1, 1.25, 1.5, 2]

export function PlayerShell() {
  const { data, loading, error } = useAppBootstrap()
  const player = useImmersivePlayer(data)

  const progress = player.current ? (player.state === 'PLAYING' ? 0.37 : 0.16) : 0
  const filledBars = Math.floor(waveformHeights.length * progress)

  const initials = player.current?.authorName ? player.initialsFor(player.current.authorName) : 'VA'
  const currentUserInitials = player.initialsFor(data?.user?.name ?? player.appState?.user?.name ?? 'Vani')

  if (loading) {
    return <div className="app-shell centered"><div className="hero-card"><h2>Bootstrapping Vani...</h2></div></div>
  }

  if (error || !player.appState || !data) {
    return <div className="app-shell centered"><div className="hero-card"><h2>Unable to load app</h2><p>{error ?? 'Unknown error'}</p></div></div>
  }

  if (player.sourceTabs.length === 0) {
    return (
      <div className="app-shell centered">
        <div className="hero-card">
          <h2>No sources configured</h2>
          <p>Enable at least one demo source before opening the listening player.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="starfield" />
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="signal signal-1" />
      <div className="signal signal-2" />
      <div className="orbital-ring orbital-ring-1" />
      <div className="orbital-ring orbital-ring-2" />

      <main className="shell">
        <div className="topbar">
          <div className="logo">vani</div>
          <div className="topbar-actions">
            <a className="mini-pill" href="/">Marketing</a>
            <button className="avatar-btn" type="button">{currentUserInitials}</button>
          </div>
        </div>

        <div className="tagline">receiving signals from earth, tuned for focused listening</div>
        <div className="status-rail">
          <div className="status-chip">mode {data.mode}</div>
          <div className="status-chip">session {data.sessionState}</div>
          <div className="status-chip">db {player.appState.health.database}</div>
          <div className="status-chip">audio {player.appState.health.audio}</div>
        </div>
        {player.notice ? <div className="notice-banner">{player.notice}</div> : null}

        <div className="source-tabs">
          {player.sourceTabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${player.selectedSource?.id === tab.id && player.mode === 'feed' ? 'active' : ''}`}
              type="button"
              onClick={() => { player.setState('PAUSED'); player.setSelectedSourceId(tab.id) }}
            >
              {tab.label}
            </button>
          ))}
          <button className={`tab ${player.mode === 'thread' ? 'active' : ''}`} type="button" onClick={() => player.openThread().catch(() => player.setState('ERROR'))}>Thread</button>
          <button className="tab" type="button" onClick={() => player.load().catch(() => player.setState('ERROR'))}>Refresh</button>
        </div>

        <div className="content-grid">
          <section className="now-playing">
            <div className="np-label"><span className="dot" />Now Playing</div>
            {player.current ? (
              <>
                <div className="np-author">
                  <div className="np-avatar">
                    {!player.brokenAvatars[player.current.authorHandle] ? (
                      <Image
                        src={avatarSrc(player.current.authorHandle)}
                        alt={`${player.current.authorName} profile`}
                        width={44}
                        height={44}
                        unoptimized
                        onError={() => player.setBrokenAvatars((prev) => ({ ...prev, [player.current!.authorHandle]: true }))}
                      />
                    ) : <span>{initials}</span>}
                  </div>
                  <div className="np-meta">
                    <div className="np-name">{player.current.authorName}</div>
                    <div className="np-handle">@{player.current.authorHandle} - {player.activeSourceLabel}</div>
                  </div>
                </div>
                <div className="np-text">{player.current.text}</div>
              </>
            ) : (
              <div className="np-text">No post loaded yet.</div>
            )}

            <div className="waveform">
              {waveformHeights.map((height, index) => (
                <div key={`${height}-${index}`} className="wave-bar" style={{ height: `${height}%` }}>
                  <div className="fill" style={{ height: index < filledBars ? '100%' : '0%' }} />
                </div>
              ))}
            </div>
            <div className="progress-time"><span>{player.state === 'PLAYING' ? 'live' : 'paused'}</span><span>{player.current ? player.currentQueue.length : 0} loaded</span></div>
            <div className="source-tabs action-tabs">
              <button className="tab" type="button" disabled={!player.activeCapabilities.canLike}>Like</button>
              <button
                className="tab"
                type="button"
                disabled={!player.activeCapabilities.canReply}
                onClick={() => { player.setComposeState('DICTATING'); player.setReplyDraft('') }}
              >
                Reply
              </button>
              <button className="tab" type="button" onClick={() => player.openThread().catch(() => player.setState('ERROR'))}>Open Thread</button>
              {player.mode === 'thread' ? <button className="tab" type="button" onClick={player.exitThreadMode}>Back to Feed</button> : null}
            </div>
            <div className="progress-time player-facts">
              <span>Rate limit {player.activeCapabilities.rateLimitRemaining}</span>
              <span>{player.mode === 'thread' ? 'Thread mode' : 'Feed mode'}</span>
            </div>
          </section>

          <section className="queue-section">
            <div className="voice-chip"><span className="dot" />{player.voiceEnabled ? 'Voice listening - say "open thread" or "reply to this"' : 'Voice commands paused'}</div>
            <div className="section-label">Up Next</div>
            <div className="queue-list">
              {player.queue.length === 0 ? (
                <div className="queue-empty">
                  <strong>No queued items beyond the current one.</strong>
                  <p>Refresh this source or switch tabs to keep the session moving.</p>
                </div>
              ) : null}

              {player.queue.map((tweet, index) => {
                const queueInitials = player.initialsFor(tweet.authorName)
                const queuePosition = player.currentIndex + index + 1
                return (
                  <article key={tweet.id} className="queue-item">
                    <button className="queue-main" type="button" onClick={() => player.setCurrentIndex(queuePosition)}>
                      <span className="q-num">{queuePosition + 1}</span>
                      <div className="q-avatar">
                        {!player.brokenAvatars[tweet.authorHandle] ? (
                          <Image
                            src={avatarSrc(tweet.authorHandle)}
                            alt={`${tweet.authorName} profile`}
                            width={36}
                            height={36}
                            unoptimized
                            onError={() => player.setBrokenAvatars((prev) => ({ ...prev, [tweet.authorHandle]: true }))}
                          />
                        ) : <span>{queueInitials}</span>}
                      </div>
                      <div className="q-content">
                        <div className="q-name">{tweet.authorName}</div>
                        <div className="q-preview">{tweet.text}</div>
                      </div>
                    </button>
                    <div className="queue-toolbar">
                      <span>#{queuePosition + 1}</span>
                      <div className="queue-toolbar-actions">
                        <button className="tab" type="button" onClick={() => player.moveQueueItem(index, 'up')}>Up</button>
                        <button className="tab" type="button" onClick={() => player.moveQueueItem(index, 'down')}>Down</button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            <section className="signal-card">
              <div className="section-label">Reply Draft</div>
              <textarea
                className="composer cosmic-composer"
                value={player.replyDraft}
                onChange={(event) => player.setReplyDraft(event.target.value)}
                placeholder={player.activeCapabilities.canReply ? 'Type a draft or use voice reply.' : 'Replies are unavailable on the current source.'}
                disabled={!player.activeCapabilities.canReply}
              />
              <div className="signal-actions">
                <button className="tab" type="button" disabled={!player.activeCapabilities.canReply} onClick={() => player.setComposeState('DICTATING')}>Dictate</button>
                <button className="tab" type="button" disabled={!player.replyDraft.trim() || !player.activeCapabilities.canReply} onClick={() => player.postReply(player.replyDraft).catch(() => undefined)}>Send</button>
                <button className="tab" type="button" disabled={!player.replyDraft} onClick={() => { player.setReplyDraft(''); player.setComposeState('IDLE') }}>Clear</button>
              </div>
              <div className="progress-time">
                <span>compose {player.composeState.toLowerCase()}</span>
                <span>{player.appState.user?.handle ?? 'guest'}</span>
              </div>
            </section>

            <section className="signal-card">
              <div className="section-label">Signal Stack</div>
              <div className="signal-grid">
                <div className="signal-pill">source {player.selectedSource?.label ?? sourceLabels.home}</div>
                <div className="signal-pill">sync {player.appState.health.sync}</div>
                <div className="signal-pill">voice {player.voiceEnabled ? 'armed' : 'off'}</div>
                <div className="signal-pill">mode {player.mode}</div>
              </div>
            </section>
          </section>
        </div>
      </main>

      <div className="player">
        <div className="player-inner">
          <div className="player-top">
            <div className="player-thumb">
              {player.current && !player.brokenAvatars[player.current.authorHandle] ? (
                <Image
                  src={avatarSrc(player.current.authorHandle)}
                  alt={`${player.current.authorName} profile`}
                  width={38}
                  height={38}
                  unoptimized
                  onError={() => player.setBrokenAvatars((prev) => ({ ...prev, [player.current!.authorHandle]: true }))}
                />
              ) : <span>{initials}</span>}
            </div>
            <div className="player-meta">
              <div className="player-name">{player.current?.authorName ?? 'Vani'}</div>
              <div className="player-source">{player.activeSourceLabel} - {Math.max(player.currentQueue.length - player.currentIndex - 1, 0)} left in queue</div>
            </div>
            <button className="speed-btn" type="button" onClick={() => player.setRate(rates[(rates.indexOf(player.rate) + 1) % rates.length])}>{player.rate}x</button>
          </div>
          <div className="player-controls">
            <button className="ctrl-btn" type="button" onClick={player.previous}>Prev</button>
            <button className="ctrl-btn" type="button" onClick={player.speakCurrent}>Replay</button>
            <button className="play-btn" type="button" onClick={player.state === 'PLAYING' ? player.pause : player.play}>{player.state === 'PLAYING' ? 'Pause' : 'Play'}</button>
            <button className="ctrl-btn" type="button" onClick={player.next}>Next</button>
            <button className="ctrl-btn mic-btn" type="button" onClick={() => player.setVoiceEnabled((value) => !value)}>Mic</button>
          </div>
        </div>
      </div>
    </>
  )
}
