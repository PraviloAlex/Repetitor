import { useNavigate } from "react-router-dom";
import { loadProgress } from "../storage/localProgress";
import { evaluateSquad, countUnlocked, type PlayerStatus } from "../engine/squad";
import type { PlayerPosition } from "../content/footballers";
import { RARITY_VISUALS } from "../cardVisuals";
import { useI18n } from "../i18n/I18nContext";

const POSITION_ROWS: { pos: PlayerPosition; cls: string }[] = [
  { pos: "FW", cls: "pitch__row--fw" },
  { pos: "MID", cls: "pitch__row--mid" },
  { pos: "DEF", cls: "pitch__row--def" },
  { pos: "GK", cls: "pitch__row--gk" },
];

function PlayerToken({ status }: { status: PlayerStatus }) {
  const { player, unlocked } = status;
  const rarity = RARITY_VISUALS[player.rarity];
  return (
    <div
      className={`player-token${unlocked ? "" : " is-locked"}`}
      style={{ borderColor: rarity.border }}
      title={player.name}
    >
      <div
        className="player-token__shirt"
        style={{ background: rarity.border }}
      >
        {unlocked ? player.number : "🔒"}
      </div>
      <div className="player-token__name">
        {unlocked ? player.name : "—"}
      </div>
      <div className="player-token__pos">{player.position}</div>
    </div>
  );
}

function PlayerRow({ status }: { status: PlayerStatus }) {
  const { pick } = useI18n();
  const { player, unlocked, progressPct } = status;
  const rarity = RARITY_VISUALS[player.rarity];
  return (
    <div
      className={`player-row${unlocked ? "" : " is-locked"}`}
      style={{ borderLeftColor: rarity.border }}
    >
      <div className="player-row__shirt" style={{ background: rarity.border }}>
        {unlocked ? player.number : "🔒"}
      </div>
      <div className="player-row__body">
        <div className="player-row__name">
          {player.name}{" "}
          <span
            className="card-rarity-chip"
            style={{
              background: rarity.soft,
              color: rarity.text,
              borderColor: rarity.border,
              marginLeft: 4,
            }}
          >
            {pick(rarity.label)}
          </span>
        </div>
        <div className="player-row__sub">
          {unlocked ? pick(player.specialty) : pick(player.unlockHint)}
        </div>
        {!unlocked && (
          <div className="player-row__progress" aria-hidden>
            <span style={{ width: progressPct + "%" }} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcademyScreen() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const state = loadProgress();
  const sessionCount = state.sessions.length;
  const squad = evaluateSquad(state.topicAccuracy, sessionCount);
  const unlocked = countUnlocked(squad);

  const unlockedList = squad.filter((s) => s.unlocked);
  const lockedList = squad.filter((s) => !s.unlocked);

  return (
    <div className="screen-enter">
      <div className="academy-head">
        <h1 className="screen-title">{t("academy_title")}</h1>
        <span className="academy-count">
          {t("academy_count", { n: String(unlocked), total: String(squad.length) })}
        </span>
      </div>
      <p className="screen-sub">{t("academy_sub")}</p>

      <div className="pitch">
        <svg
          className="pitch__lines"
          viewBox="0 0 300 400"
          preserveAspectRatio="none"
          aria-hidden
        >
          <g fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2">
            <rect x="6" y="6" width="288" height="388" rx="4" />
            <line x1="6" y1="200" x2="294" y2="200" />
            <circle cx="150" cy="200" r="42" />
            <rect x="95" y="6" width="110" height="58" />
            <rect x="95" y="336" width="110" height="58" />
          </g>
        </svg>

        {POSITION_ROWS.map(({ pos, cls }) => (
          <div key={pos} className={`pitch__row ${cls}`}>
            {squad
              .filter((s) => s.player.position === pos)
              .map((s) => (
                <PlayerToken key={s.player.id} status={s} />
              ))}
          </div>
        ))}
      </div>

      {unlockedList.length > 0 && (
        <>
          <h2 className="section-heading">{t("academy_in_squad")}</h2>
          <div className="player-list">
            {unlockedList.map((s) => (
              <PlayerRow key={s.player.id} status={s} />
            ))}
          </div>
        </>
      )}

      {lockedList.length > 0 && (
        <>
          <h2 className="section-heading">{t("academy_to_unlock")}</h2>
          <div className="player-list">
            {lockedList.map((s) => (
              <PlayerRow key={s.player.id} status={s} />
            ))}
          </div>
        </>
      )}

      <p className="muted" style={{ fontSize: 12.5, marginTop: 18 }}>
        {t("academy_parent_note")}
      </p>

      <button
        className="btn btn-soft"
        style={{ marginTop: 12 }}
        onClick={() => navigate("/")}
      >
        {t("academy_back")}
      </button>
    </div>
  );
}
