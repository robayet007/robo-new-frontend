import { useState } from 'react';

type FFBasicInfo = {
  accountId: string;
  nickname: string;
  region: string;
  level: number;
  exp: number;
  rank: number;
  rankingPoints: number;
  hasElitePass: boolean;
  badgeCnt: number;
  liked: number;
  lastLoginAt: string;
  maxRank: number;
  csRank: number;
  csMaxRank: number;
};

type FFClanInfo = {
  clanId: string;
  clanName: string;
  clanLevel: number;
  capacity: number;
  memberNum: number;
};

type FFAccountResponse = {
  basicInfo: FFBasicInfo;
  clanBasicInfo?: FFClanInfo;
};

function formatUnixSeconds(sec: string | number | undefined) {
  if (!sec) return '-';
  const ts = Number(sec) * 1000;
  if (Number.isNaN(ts)) return '-';
  return new Date(ts).toLocaleString('bn-BD', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function FFIdInfo() {
  const [uid, setUid] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FFAccountResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setData(null);

    const trimmed = uid.trim();
    if (!trimmed) {
      setError('Please enter your Free Fire UID.');
      return;
    }

    try {
      setLoading(true);
      const url = `https://info-ob49.vercel.app/api/account/?uid=${encodeURIComponent(
        trimmed
      )}&region=BD`;
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`Request failed: ${resp.status} ${resp.statusText}`);
      }
      const json = (await resp.json()) as FFAccountResponse;
      if (!json || !json.basicInfo) {
        throw new Error('No account info found for this UID.');
      }
      setData(json);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch account info. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const basic = data?.basicInfo;
  const clan = data?.clanBasicInfo;

  return (
    <div className="max-w-xl p-4 mx-auto mt-4 bg-white border shadow-xl sm:mt-6 md:mt-8 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border-slate-200">
      <div className="mb-5 text-center">
        <p className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-400/10 text-sky-700 border border-sky-400/40 font-semibold text-xs sm:text-sm mb-3">
          🔍 FF ID Info
        </p>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
          Check Free Fire Account Info
        </h2>
        <p className="mt-1 text-xs text-slate-600 sm:text-sm">
          Enter any Free Fire UID to see basic account and clan information (Region: BD).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 mb-4">
        <label className="block text-sm font-semibold text-slate-800">
          Free Fire UID
          <input
            type="text"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            placeholder="Example: 1415997921"
            className="w-full px-4 py-2.5 mt-1 text-sm border-2 rounded-xl border-slate-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          />
        </label>
        <button
          type="submit"
          disabled={loading || !uid.trim()}
          className="w-full px-4 py-2.5 mt-1 text-sm font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-500/30"
        >
          {loading ? 'Checking...' : 'Check Info'}
        </button>
      </form>

      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 border border-red-200 rounded-xl bg-red-50">
          {error}
        </div>
      )}

      {basic && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h3 className="mb-2 text-sm font-bold text-slate-900 sm:text-base">
              Basic Info
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-slate-700">
              <p>
                <span className="font-semibold">Nickname:</span> {basic.nickname}
              </p>
              <p>
                <span className="font-semibold">UID:</span> {basic.accountId}
              </p>
              <p>
                <span className="font-semibold">Region:</span> {basic.region}
              </p>
              <p>
                <span className="font-semibold">Level:</span> {basic.level}
              </p>
              <p>
                <span className="font-semibold">Rank (BR):</span> {basic.rank}
              </p>
              <p>
                <span className="font-semibold">Max Rank:</span> {basic.maxRank}
              </p>
              <p>
                <span className="font-semibold">CS Rank:</span> {basic.csRank}
              </p>
              <p>
                <span className="font-semibold">CS Max Rank:</span> {basic.csMaxRank}
              </p>
              <p>
                <span className="font-semibold">Likes:</span> {basic.liked}
              </p>
              <p>
                <span className="font-semibold">Elite Pass:</span>{' '}
                {basic.hasElitePass ? 'Yes' : 'No'}
              </p>
              <p>
                <span className="font-semibold">Badges:</span> {basic.badgeCnt}
              </p>
              <p>
                <span className="font-semibold">Last Login:</span>{' '}
                {formatUnixSeconds(basic.lastLoginAt)}
              </p>
            </div>
          </div>

          {clan && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h3 className="mb-2 text-sm font-bold text-slate-900 sm:text-base">
                Clan Info
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Name:</span> {clan.clanName}
                </p>
                <p>
                  <span className="font-semibold">Clan ID:</span> {clan.clanId}
                </p>
                <p>
                  <span className="font-semibold">Level:</span> {clan.clanLevel}
                </p>
                <p>
                  <span className="font-semibold">Members:</span> {clan.memberNum}/
                  {clan.capacity}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FFIdInfo;


