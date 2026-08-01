import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase, type Conversation, type Message } from '@/lib/supabase';
import { Send, ArrowLeft, MessageCircle, BadgeCheck } from 'lucide-react';

export function MessagesPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from('conversations')
      .select(`
        *,
        listings:listing_id (id, title, price, status),
        buyer:buyer_id (id, username, avatar_url, is_verified),
        seller:seller_id (id, username, avatar_url, is_verified)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false })
      .then(({ data }) => {
        const convos = (data as Conversation[]) ?? [];
        setConversations(convos);
        setLoading(false);
        if (id) {
          const active = convos.find((c) => c.id === id);
          setActiveConvo(active ?? null);
        } else if (convos.length > 0 && !id) {
          navigate(`/messages/${convos[0].id}`, { replace: true });
        }
      });
  }, [user]);

  useEffect(() => {
    if (id && conversations.length > 0) {
      const active = conversations.find((c) => c.id === id);
      setActiveConvo(active ?? null);
    } else if (!id) {
      setActiveConvo(null);
    }
  }, [id, conversations]);

  useEffect(() => {
    if (!activeConvo) return;
    supabase
      .from('messages')
      .select('*, profiles:sender_id (id, username, avatar_url)')
      .eq('conversation_id', activeConvo.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages((data as Message[]) ?? []);
      });

    const channel = supabase
      .channel(`messages-${activeConvo.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConvo.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          if ((payload.new as Message).sender_id !== user?.id) {
            supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', (payload.new as Message).id)
              .then(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConvo, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvo || !user) return;
    setSending(true);
    const { data } = await supabase
      .from('messages')
      .insert({
        conversation_id: activeConvo.id,
        sender_id: user.id,
        body: newMessage.trim(),
      })
      .select('*, profiles:sender_id (id, username, avatar_url)')
      .single();

    if (data) {
      setMessages((prev) => [...prev, data as Message]);
      setNewMessage('');
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', activeConvo.id);
    }
    setSending(false);
  };

  const otherParty = (c: Conversation) => {
    if (!user) return null;
    return user.id === c.buyer_id ? c.seller : c.buyer;
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-stone-900 mb-4">Messages</h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-stone-300">
            <MessageCircle className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-600 font-medium">No conversations yet</p>
            <p className="text-sm text-stone-400 mt-1">Message a seller from any listing to start chatting.</p>
            <Link to="/search" className="inline-block mt-4 px-4 py-2 bg-emerald-600 text-white text-sm rounded-full hover:bg-emerald-700">
              Browse items
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 bg-white rounded-2xl border border-stone-200 overflow-hidden h-[70vh]">
            {/* Conversation list */}
            <div className={`lg:border-r border-stone-200 overflow-y-auto ${activeConvo ? 'hidden lg:block' : ''}`}>
              {conversations.map((c) => {
                const other = otherParty(c);
                const active = activeConvo?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/messages/${c.id}`)}
                    className={`w-full flex items-center gap-3 p-4 text-left border-b border-stone-100 transition-colors ${active ? 'bg-emerald-50' : 'hover:bg-stone-50'}`}
                  >
                    {other?.avatar_url ? (
                      <img src={other.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold shrink-0">
                        {(other?.username ?? '?')[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-semibold text-stone-900 truncate">{other?.username ?? 'User'}</p>
                        {other?.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                      <p className="text-xs text-stone-500 truncate">{c.listings?.title}</p>
                      <p className="text-xs text-stone-400">${Number(c.listings?.price ?? 0).toFixed(2)}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Chat panel */}
            <div className={`lg:col-span-2 flex flex-col ${!activeConvo ? 'hidden lg:flex' : ''}`}>
              {activeConvo ? (
                <>
                  <div className="p-4 border-b border-stone-200 flex items-center gap-3">
                    <button onClick={() => navigate('/messages')} className="lg:hidden p-1 text-stone-500">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    {(() => {
                      const other = otherParty(activeConvo);
                      return other?.avatar_url ? (
                        <img src={other.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
                          {(other?.username ?? '?')[0]?.toUpperCase()}
                        </div>
                      );
                    })()}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-900 truncate">
                        {otherParty(activeConvo)?.username ?? 'User'}
                      </p>
                      <Link to={`/listing/${activeConvo.listing_id}`} className="text-xs text-emerald-700 hover:underline">
                        {activeConvo.listings?.title}
                      </Link>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50">
                    {messages.map((m) => {
                      const mine = m.sender_id === user?.id;
                      return (
                        <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${mine ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white border border-stone-200 text-stone-800 rounded-bl-sm'}`}>
                            <p className="whitespace-pre-wrap">{m.body}</p>
                            <p className={`text-[10px] mt-1 ${mine ? 'text-emerald-100' : 'text-stone-400'}`}>
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={sendMessage} className="p-4 border-t border-stone-200 flex items-center gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 bg-stone-100 rounded-full text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100"
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="p-2.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-stone-400">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 text-stone-300" />
                    <p className="text-sm">Select a conversation to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
