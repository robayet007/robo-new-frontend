import { useState, useRef, useEffect } from 'react';
import { SmartAPIManager } from '../services/api';

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
  const [retryCount, setRetryCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isCancelledRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isCancelledRef.current = true;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchFFInfo = async (trimmedUid: string, attempt: number = 0): Promise<void> => {
    if (isCancelledRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const response = await SmartAPIManager.smartFetch(`/player-nickname?uid=${encodeURIComponent(trimmedUid)}`);

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();

      if (!json || !json.success || !json.player_info) {
        throw new Error(json?.message || 'No account info found for this UID.');
      }

      // Map the internal structure to the component's expected structure
      const mappedData: FFAccountResponse = {
        basicInfo: {
          accountId: String(json.player_info.uid || trimmedUid),
          nickname: json.player_info.nickname || 'Unknown',
          region: json.player_info.region || 'BD',
          level: json.player_info.level || 0,
          exp: 0,
          rank: 0,
          rankingPoints: 0,
          hasElitePass: false,
          badgeCnt: 0,
          liked: json.player_info.likes || 0,
          lastLoginAt: '',
          maxRank: 0,
          csRank: 0,
          csMaxRank: 0,
        }
      };

      if (!isCancelledRef.current) {
        setData(mappedData);
        setError(null);
        setLoading(false);
        setRetryCount(0);
      }
    } catch (err: any) {
      if (isCancelledRef.current) return;

      // Handle abort separately if needed, but smartFetch throws on timeout/abort
      if (err.name === 'AbortError') {
        if (attempt < 5) { // Reduced retries for simpler logic
          setRetryCount(attempt + 1);
          setTimeout(() => fetchFFInfo(trimmedUid, attempt + 1), 1000);
        } else {
          setError('Request timeout. Please check your connection and try again.');
          setLoading(false);
        }
        return;
      }

      // Retry on other errors
      if (attempt < 3) {
        setRetryCount(attempt + 1);
        setTimeout(() => fetchFFInfo(trimmedUid, attempt + 1), 1500);
      } else {
        setError(err?.message || 'Failed to fetch account info. Please try again.');
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setData(null);
    setRetryCount(0);
    isCancelledRef.current = false;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const trimmed = uid.trim();
    if (!trimmed) {
      setError('Please enter your Free Fire UID.');
      return;
    }

    // Start fetching with retry logic
    fetchFFInfo(trimmed, 0);
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

      <form onSubmit={handleSubmit} className="mb-4 space-y-3">
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
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Checking{retryCount > 0 ? ` (Retry ${retryCount})...` : '...'}
            </span>
          ) : (
            'Check Info'
          )}
        </button>
      </form>

      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 border border-red-200 rounded-xl bg-red-50">
          {error}
        </div>
      )}

      {basic && (
        <div className="space-y-4">
          <div className="p-4 border rounded-xl bg-slate-50 border-slate-200">
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
            <div className="p-4 border rounded-xl bg-slate-50 border-slate-200">
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




