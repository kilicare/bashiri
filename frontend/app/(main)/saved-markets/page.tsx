"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSavedMarkets, generateSavedMarketsPDF, unsaveMarket } from "@/lib/api/predictions";
import { Spinner } from "@/components/ui/Spinner";
import { Bookmark, Download, CheckCircle, Trash2, Share2, Copy, MessageCircle, Send, ArrowLeft } from "lucide-react";
import { AlertModal } from "@/components/ui/AlertModal";
import { useAuthStore } from "@/stores/auth.store";

interface SavedMarket {
  id: number;
  match: {
    id: number;
    home_team: { name: string };
    away_team: { name: string };
    kickoff_at: string;
    league: { name: string };
  };
  market_key: string;
  created_at: string;
  ai_pick?: string;
  ai_confidence?: number;
}

export default function SavedMarketsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [savedMarkets, setSavedMarkets] = useState<SavedMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [marketToDelete, setMarketToDelete] = useState<{ id: number; matchId: number; marketKey: string } | null>(null);
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; variant: "success" | "error" | "warning" | "info" }>({
    isOpen: false,
    title: "",
    message: "",
    variant: "info"
  });
  const [selectedMarkets, setSelectedMarkets] = useState<Set<number>>(new Set());
  const [showMultiDeleteModal, setShowMultiDeleteModal] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Check authentication
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "#0a0a0a" }}>
        <div className="text-center">
          <Bookmark size={48} style={{ color: "#D4AF37", opacity: 0.5 }} className="mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Tafadhali Jiunge Ndogo</h2>
          <p className="text-sm text-white/50 mb-6">Unahitaji kuwa na akaunti ili kuona saved markets zako.</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
          >
            Ingia / Jisajili
          </button>
        </div>
      </div>
    );
  }

  // Convert market key to readable label
  const getMarketLabel = (key: string) => {
    const labels: Record<string, string> = {
      // Full Match Markets
      "1X2": "Matokeo ya Mechi",
      "DOUBLE_CHANCE": "Double Chance",
      "DRAW_NO_BET": "Draw No Bet",
      "BTTS": "Timu Zote Kufunga (BTTS)",
      "OVER_UNDER_1_5": "Over/Under 1.5",
      "OVER_UNDER_2_5": "Over/Under 2.5",
      // Home Team Goals
      "HOME_GOALS_OVER_0_5": "Home Over/Under 0.5",
      "HOME_GOALS_OVER_1_5": "Home Over/Under 1.5",
      "HOME_GOALS_OVER_2_5": "Home Over/Under 2.5",
      // Away Team Goals
      "AWAY_GOALS_OVER_0_5": "Away Over/Under 0.5",
      "AWAY_GOALS_OVER_1_5": "Away Over/Under 1.5",
      "AWAY_GOALS_OVER_2_5": "Away Over/Under 2.5",
      // Correct Score
      "CORRECT_SCORE": "Correct Score",
    };
    return labels[key] || key;
  };

  useEffect(() => {
    loadSavedMarkets();
  }, []);

  async function loadSavedMarkets() {
    try {
      const markets = await getSavedMarkets();
      setSavedMarkets(markets);
    } catch (error) {
      console.error("Failed to load saved markets:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePDF() {
    if (currentMarkets.length === 0) return;
    
    setGeneratingPDF(true);
    try {
      const blob = await generateSavedMarketsPDF(activeTab) as unknown as Blob;
      
      // Create URL for preview
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      setShowPDFPreview(true);
      
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      setAlertModal({
        isOpen: true,
        title: "Imeshindwa",
        message: "Failed to generate PDF. Please try again.",
        variant: "error"
      });
    } finally {
      setGeneratingPDF(false);
    }
  }

  function handleDownloadPDF() {
    if (!pdfUrl) return;
    
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `bashiri_saved_markets_${activeTab.replace('_', '-')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setShowSuccessModal(true);
  }

  function handleOpenPDFInNewTab() {
    if (!pdfUrl) return;
    window.open(pdfUrl, '_blank');
  }

  // Detect mobile device
  const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  async function handleShare() {
    if (!pdfUrl) {
      // Generate PDF first if not already generated
      await handleGeneratePDF();
      return;
    }
    
    // Convert blob URL to File for sharing
    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const file = new File([blob], `bashiri_saved_markets_${activeTab.replace('_', '-')}.pdf`, { type: 'application/pdf' });
      
      // Try to share the file using Web Share API
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Bashiri Saved Markets',
          text: `Angalia saved markets zangu za football kwenye Bashiri`
        });
      } else {
        // Fallback: show share modal with link
        const url = `${window.location.origin}/saved-markets?tab=${activeTab}`;
        setShareUrl(url);
        setShowShareModal(true);
      }
    } catch (error) {
      console.error('Failed to share PDF:', error);
      // Fallback to link sharing
      const url = `${window.location.origin}/saved-markets?tab=${activeTab}`;
      setShareUrl(url);
      setShowShareModal(true);
    }
  }

  function handleCopyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setAlertModal({
      isOpen: true,
      title: "Imekopiwaa!",
      message: "Link imekopiwaa kwenye clipboard.",
      variant: "success"
    });
    setShowShareModal(false);
  }

  function handleShareWhatsApp() {
    if (!shareUrl) return;
    const text = `Angalia saved markets zangu za football kwenye Bashiri: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  function handleShareTelegram() {
    if (!shareUrl) return;
    const text = `Angalia saved markets zangu za football kwenye Bashiri: ${shareUrl}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`, '_blank');
  }

  async function handleDelete(marketId: number, matchId: number, marketKey: string) {
    setMarketToDelete({ id: marketId, matchId, marketKey });
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!marketToDelete) return;
    
    setDeletingId(marketToDelete.id);
    setShowDeleteModal(false);
    try {
      await unsaveMarket(marketToDelete.matchId, marketToDelete.marketKey);
      setSavedMarkets(prev => prev.filter(m => m.id !== marketToDelete.id));
    } catch (error) {
      console.error("Failed to delete market:", error);
      setAlertModal({
        isOpen: true,
        title: "Imeshindwa",
        message: "Failed to delete market. Please try again.",
        variant: "error"
      });
    } finally {
      setDeletingId(null);
      setMarketToDelete(null);
    }
  }

  function toggleSelectMode() {
    setIsSelectMode(!isSelectMode);
    setSelectedMarkets(new Set());
  }

  function toggleMarketSelection(marketId: number) {
    setSelectedMarkets(prev => {
      const next = new Set(prev);
      if (next.has(marketId)) {
        next.delete(marketId);
      } else {
        next.add(marketId);
      }
      return next;
    });
  }

  function selectAllMarkets() {
    const allIds = currentMarkets.map(m => m.id);
    setSelectedMarkets(new Set(allIds));
  }

  function deselectAllMarkets() {
    setSelectedMarkets(new Set());
  }

  async function confirmMultiDelete() {
    if (selectedMarkets.size === 0) return;
    
    setShowMultiDeleteModal(false);
    setDeletingId(-1); // Use -1 to indicate bulk operation
    
    try {
      // Delete all selected markets
      const deletePromises = Array.from(selectedMarkets).map(async (marketId) => {
        const market = savedMarkets.find(m => m.id === marketId);
        if (market) {
          await unsaveMarket(market.match.id, market.market_key);
        }
      });
      
      await Promise.all(deletePromises);
      
      // Update local state
      setSavedMarkets(prev => prev.filter(m => !selectedMarkets.has(m.id)));
      setSelectedMarkets(new Set());
      setIsSelectMode(false);
      
      setAlertModal({
        isOpen: true,
        title: "Imefanikiwa!",
        message: `${selectedMarkets.size} masoko yamefutwa kikamilifu.`,
        variant: "success"
      });
    } catch (error) {
      console.error("Failed to delete markets:", error);
      setAlertModal({
        isOpen: true,
        title: "Imeshindwa",
        message: "Failed to delete markets. Please try again.",
        variant: "error"
      });
    } finally {
      setDeletingId(null);
    }
  }

  // Group markets by type based on actual market keys from backend
  const marketGroups = {
    all: savedMarkets,
    over_under: savedMarkets.filter(m => 
      m.market_key.includes('OVER_UNDER')
    ),
    match_result: savedMarkets.filter(m => 
      ['1X2', 'DOUBLE_CHANCE', 'DRAW_NO_BET'].includes(m.market_key)
    ),
    btts: savedMarkets.filter(m => 
      m.market_key === 'BTTS'
    ),
  };

  const tabs = [
    { id: "all", label: "All Markets" },
    { id: "over_under", label: "Over/Under" },
    { id: "match_result", label: "Match Result" },
    { id: "btts", label: "BTTS" },
  ];

  const currentMarkets = marketGroups[activeTab as keyof typeof marketGroups] || [];

  // Group markets by match ID
  const groupedByMatch = currentMarkets.reduce((acc, market) => {
    const matchId = market.match.id;
    if (!acc[matchId]) {
      acc[matchId] = {
        match: market.match,
        markets: [],
      };
    }
    acc[matchId].markets.push(market);
    return acc;
  }, {} as Record<number, { match: SavedMarket['match']; markets: SavedMarket[] }>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <Spinner size={24} color="rgba(255,255,255,0.6)" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      {/* Header */}
      <div className="px-5 pt-safe pt-10 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} aria-label="Rudi nyuma">
            <ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} />
          </button>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(212, 175, 55, 0.2)" }}>
            <Bookmark size={20} style={{ color: "#D4AF37" }} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Saved Markets</h1>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {savedMarkets.length} market{savedMarkets.length !== 1 ? 's' : ''} saved
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all"
              style={{
                background: activeTab === tab.id ? "rgba(212, 175, 55, 0.2)" : "rgba(255,255,255,0.05)",
                color: activeTab === tab.id ? "#D4AF37" : "rgba(255,255,255,0.6)",
                border: activeTab === tab.id ? "1px solid #D4AF37" : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Generate and Share Buttons */}
        <div className="mt-4 flex gap-2">
          {isSelectMode ? (
            <>
              <button
                onClick={selectAllMarkets}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold transition-all hover:bg-white/10"
                style={{ background: "rgba(0, 255, 135, 0.15)", color: "#00FF87", border: "1px solid rgba(0, 255, 135, 0.3)" }}
              >
                Chagua Zote
              </button>
              <button
                onClick={deselectAllMarkets}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold transition-all hover:bg-white/10"
                style={{ background: "rgba(255, 255, 255, 0.1)", color: "white", border: "1px solid rgba(255, 255, 255, 0.2)" }}
              >
                Ghairi Zote
              </button>
              {selectedMarkets.size > 0 && (
                <button
                  onClick={() => setShowMultiDeleteModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold transition-all hover:bg-white/10"
                  style={{ background: "rgba(255, 100, 100, 0.15)", color: "#FF6464", border: "1px solid rgba(255, 100, 100, 0.3)" }}
                >
                  <Trash2 size={14} />
                  Futa ({selectedMarkets.size})
                </button>
              )}
              <button
                onClick={toggleSelectMode}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold transition-all hover:bg-white/10"
                style={{ background: "rgba(255, 255, 255, 0.1)", color: "white", border: "1px solid rgba(255, 255, 255, 0.2)" }}
              >
                Katisha
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleSelectMode}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold transition-all hover:bg-white/10"
                style={{ background: "rgba(255, 255, 255, 0.1)", color: "white", border: "1px solid rgba(255, 255, 255, 0.2)" }}
              >
                Chagua
              </button>
              <button
                onClick={handleGeneratePDF}
                disabled={generatingPDF || currentMarkets.length === 0}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold transition-all hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "rgba(212, 175, 55, 0.15)", color: "#D4AF37", border: "1px solid rgba(212, 175, 55, 0.3)" }}
              >
                {generatingPDF ? (
                  <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                {generatingPDF ? "..." : "PDF"}
              </button>
              <button
                onClick={handleShare}
                disabled={currentMarkets.length === 0}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold transition-all hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "rgba(212, 175, 55, 0.15)", color: "#D4AF37", border: "1px solid rgba(212, 175, 55, 0.3)" }}
              >
                <Share2 size={14} />
                Share
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-8">
        {currentMarkets.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark size={48} style={{ color: "rgba(255,255,255,0.2)" }} />
            <p className="text-sm mt-4" style={{ color: "rgba(255,255,255,0.4)" }}>
              No saved markets in this category
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.values(groupedByMatch).map(({ match, markets }) => (
              <div
                key={match.id}
                className="rounded-2xl p-4 transition-all"
                style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {match.league.name}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">
                      {match.home_team.name} vs {match.away_team.name}
                    </h3>
                  </div>
                </div>
                
                {/* Markets list */}
                <div className="space-y-2 mb-3">
                  {markets.map((market) => (
                    <div
                      key={market.id}
                      className={`flex items-center justify-between p-2 rounded-lg transition-all ${isSelectMode ? 'cursor-pointer hover:bg-white/5' : ''}`}
                      style={{ background: isSelectMode && selectedMarkets.has(market.id) ? "rgba(212, 175, 55, 0.1)" : "rgba(255,255,255,0.03)" }}
                      onClick={() => isSelectMode && toggleMarketSelection(market.id)}
                    >
                      <div className="flex items-center gap-2">
                        {isSelectMode && (
                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center border-2 transition-all ${selectedMarkets.has(market.id) ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-white/30'}`}>
                            {selectedMarkets.has(market.id) && (
                              <div className="w-3 h-3 rounded-full bg-black" />
                            )}
                          </div>
                        )}
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(212, 175, 55, 0.2)", color: "#D4AF37" }}>
                          {getMarketLabel(market.market_key)}
                        </span>
                        {market.ai_pick && (
                          <span className="text-xs font-bold" style={{ color: "#00FF87" }}>
                            AI: {market.ai_pick} {market.ai_confidence && `(${market.ai_confidence}%)`}
                          </span>
                        )}
                      </div>
                      {!isSelectMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(market.id, market.match.id, market.market_key);
                          }}
                          disabled={deletingId === market.id}
                          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/20 disabled:opacity-50"
                        >
                          {deletingId === market.id ? (
                            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          ) : (
                            <Trash2 size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <span>
                    {new Date(match.kickoff_at).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span>
                    {markets.length} market{markets.length !== 1 ? 's' : ''} saved
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.8)" }}
          onClick={() => setShowSuccessModal(false)}
        >
          <div 
            className="rounded-2xl p-6 max-w-sm w-full mx-4"
            style={{ background: "#111111", border: "1px solid rgba(212, 175, 55, 0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: "rgba(0, 255, 135, 0.2)" }}
              >
                <CheckCircle size={32} style={{ color: "#00FF87" }} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                PDF Imeshapakuliwa!
              </h3>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>
                Faili lako la PDF limehifadhiwa kwenye kifaa chako.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 rounded-xl font-bold transition-all"
                style={{ background: "#D4AF37", color: "#000" }}
              >
                Sawa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.8)" }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div 
            className="rounded-2xl p-6 max-w-sm w-full mx-4"
            style={{ background: "#111111", border: "1px solid rgba(255, 100, 100, 0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: "rgba(255, 100, 100, 0.2)" }}
              >
                <Trash2 size={32} style={{ color: "#FF6464" }} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Futa Soko?
              </h3>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>
                Unahitaji kufuta soko hili kutoka kwenye orodha yako ya saved markets?
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold transition-all"
                  style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
                >
                  Hapana
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 rounded-xl font-bold transition-all"
                  style={{ background: "#FF6464", color: "#000" }}
                >
                  Ndiyo, Futa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {showPDFPreview && pdfUrl && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.9)" }}
          onClick={() => setShowPDFPreview(false)}
        >
          <div 
            className="rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col"
            style={{ background: "#111111", border: "1px solid rgba(212, 175, 55, 0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  {isMobile ? "PDF Options" : "PDF Preview"}
                </h3>
                <button
                  onClick={() => setShowPDFPreview(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
                >
                  <Trash2 size={18} style={{ color: "rgba(255,255,255,0.6)" }} />
                </button>
              </div>
            </div>
            
            {isMobile ? (
              // Mobile: Show options instead of iframe
              <div className="flex-1 p-6 flex flex-col items-center justify-center">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                  style={{ background: "rgba(212, 175, 55, 0.2)" }}
                >
                  <Download size={40} style={{ color: "#D4AF37" }} />
                </div>
                <p className="text-center mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Chagua jinsi unavyotaka kutumia PDF hii
                </p>
              </div>
            ) : (
              // Desktop: Show iframe preview
              <div className="flex-1 overflow-auto p-4">
                <iframe
                  src={pdfUrl}
                  className="w-full h-full rounded-lg"
                  style={{ minHeight: "500px" }}
                />
              </div>
            )}
            
            <div className="p-4 border-t flex gap-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <button
                onClick={handleShare}
                className="flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                style={{ background: "rgba(212, 175, 55, 0.2)", color: "#D4AF37", border: "1px solid rgba(212, 175, 55, 0.3)" }}
              >
                <Share2 size={16} />
                Share
              </button>
              <button
                onClick={() => setShowPDFPreview(false)}
                className="flex-1 py-3 rounded-xl font-bold transition-all"
                style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
              >
                Funga
              </button>
              <button
                onClick={isMobile ? handleOpenPDFInNewTab : handleDownloadPDF}
                className="flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                style={{ background: "#D4AF37", color: "#000" }}
              >
                <Download size={16} />
                {isMobile ? "Fungua" : "Pakua"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.8)" }}
          onClick={() => setShowShareModal(false)}
        >
          <div 
            className="rounded-2xl p-6 max-w-sm w-full mx-4"
            style={{ background: "#111111", border: "1px solid rgba(212, 175, 55, 0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: "rgba(212, 175, 55, 0.2)" }}
              >
                <Share2 size={32} style={{ color: "#D4AF37" }} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Share Saved Markets
              </h3>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>
                Chagua jinsi unavyotaka kushare saved markets zako
              </p>
              
              <div className="space-y-3 w-full">
                <button
                  onClick={handleCopyLink}
                  className="w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-3"
                  style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
                >
                  <Copy size={18} />
                  Copy Link
                </button>
                <button
                  onClick={handleShareWhatsApp}
                  className="w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-3"
                  style={{ background: "#25D366", color: "#000" }}
                >
                  <MessageCircle size={18} />
                  WhatsApp
                </button>
                <button
                  onClick={handleShareTelegram}
                  className="w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-3"
                  style={{ background: "#0088cc", color: "#000" }}
                >
                  <Send size={18} />
                  Telegram
                </button>
              </div>
              
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full py-3 rounded-xl font-bold transition-all mt-4"
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" }}
              >
                Ghairi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Delete Confirmation Modal */}
      {showMultiDeleteModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.8)" }}
          onClick={() => setShowMultiDeleteModal(false)}
        >
          <div 
            className="rounded-2xl p-6 max-w-sm w-full mx-4"
            style={{ background: "#111111", border: "1px solid rgba(255, 100, 100, 0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: "rgba(255, 100, 100, 0.2)" }}
              >
                <Trash2 size={32} style={{ color: "#FF6464" }} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Futa Masoko?
              </h3>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>
                Unahitaji kufuta {selectedMarkets.size} masoko kutoka kwenye orodha yako ya saved markets?
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowMultiDeleteModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold transition-all"
                  style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
                >
                  Hapana
                </button>
                <button
                  onClick={confirmMultiDelete}
                  className="flex-1 py-3 rounded-xl font-bold transition-all"
                  style={{ background: "#FF6464", color: "#000" }}
                >
                  Ndiyo, Futa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
    </div>
  );
}
