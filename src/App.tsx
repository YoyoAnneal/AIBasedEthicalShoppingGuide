import React, { useState } from "react";
import axios from "axios";
import { Search, MessageCircle, AlertTriangle, Loader2 } from 'lucide-react';
import styles from './EthicalShoppingGuide.module.css'; // Import CSS Module

interface ProductData {
    name: string;
    brands: string;
    ingredients: string;
    sustainability: {
        eco_score: string;
    };
    brandInfo?: {
        rating: string;
        summary: string;
        ethicalScore: number;
    };
}

const colorPalette = {
    primary: "#f5f5f5",
    secondary: "#e0f2fe",
    accent: "#a7f3d0",
    text: "#1e293b",
    textSecondary: "#6b7280",
    error: "#dc2626",
    success: "#16a34a",
};

export default function App() {
    const [barcode, setBarcode] = useState("");
    const [productData, setProductData] = useState<ProductData | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);

    const fetchProductData = async () => {
        if (!barcode) return;
        setLoading(true);
        setError("");
        try {
            const res = await axios.get(`http://localhost:5000/api/product/${barcode}`);
            setProductData(res.data);
        } catch (err: any) {
            setProductData(null);
            setError("Product not found or failed to fetch data.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetchProductData();
    };

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const userMessage = { sender: "You", text: chatInput };
        setMessages([...messages, userMessage]);
        setChatInput("");
        setIsChatLoading(true);

        try {
            // Send barcode with the message
            const res = await axios.post("http://localhost:5000/api/chat", { message: chatInput, barcode: barcode });
            setMessages((prev) => [...prev, { sender: "AI", text: res.data.reply }]);
        } catch (err: any) {
            setMessages((prev) => [...prev, { sender: "AI", text: "Sorry, I couldn't process that. " + (err.response?.data?.error || "Please try again.") }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    return (
        <div className={styles.appContainer}>
            <h1 className={styles.heading}>
                <span style={{ color: colorPalette.accent }}>Ethical</span> Shopping Guide
            </h1>

            <form onSubmit={handleSubmit} className={styles.form}>
                <input
                    type="text"
                    placeholder="Enter Barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className={styles.input}
                />
                <button type="submit" className={styles.button} disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className={`${styles.loader} w-5 h-5`} />
                            <span>Loading...</span>
                        </>
                    ) : (
                        <>
                            <Search className="w-5 h-5" />
                            <span>Search</span>
                        </>
                    )}
                </button>
            </form>

            {error && (
                <p className={styles.error}>
                    <AlertTriangle className="inline-block w-5 h-5 mr-2" />
                    {error}
                </p>
            )}

            {productData && (
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Product Info</h2>
                    <div className={styles.cardContent}>
                        <p><strong>Name:</strong> {productData.name}</p>
                        <p><strong>Brands:</strong> {productData.brands}</p>
                        <p><strong>Ingredients:</strong> {productData.ingredients}</p>
                        <p><strong>Eco Score:</strong> <span style={{ fontWeight: 'bold' }}>{productData.sustainability.eco_score}</span></p>
                        {productData.brandInfo && (
                            <button onClick={() => {}} className={styles.brandButton} disabled={loading}>
                                Brand Rating Available
                            </button>
                        )}
                    </div>
                </div>
            )}

            {productData?.brandInfo && (
                <div className={`${styles.card} ${styles.brandCard}`}>
                    <h2 className={styles.cardTitle}>Brand Sustainability</h2>
                    <div className={styles.cardContent}>
                        <p><strong>Name:</strong> {productData.brands}</p>
                        <p><strong>Rating:</strong> <span style={{ fontWeight: 'bold' }}>{productData.brandInfo.rating}</span></p>
                        <p><strong>Summary:</strong> {productData.brandInfo.summary}</p>
                        <p><strong>Ethical Score:</strong> <span style={{ fontWeight: 'bold' }}>{productData.brandInfo.ethicalScore}</span></p>
                    </div>
                </div>
            )}

            <div className={styles.chatCard}>
                <h2 className={styles.chatTitle}>
                    <MessageCircle className="w-6 h-6" />
                    Ask the AI Assistant
                </h2>
                <div className={styles.chatMessages}>
                    {messages.map((msg, idx) => (
                        <div key={idx} className={msg.sender === 'You' ? styles.userMessage : styles.aiMessage}>
                            <strong className={styles.sender}>
                                {msg.sender}:
                            </strong>
                            <span className={styles.messageText}>
                                {msg.text}
                            </span>
                        </div>
                    ))}
                    {isChatLoading && (
                        <div className={styles.aiMessage}>
                            <strong className={styles.sender}>
                                AI:
                            </strong>
                            <Loader2 className={`${styles.loader} w-5 h-5 text-accent`} />
                            <span className={styles.messageText}>
                                Thinking...
                            </span>
                        </div>
                    )}
                </div>
                <form onSubmit={handleChatSubmit} className={styles.chatForm}>
                    <input
                        type="text"
                        placeholder="Ask something..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className={styles.chatInput}
                        disabled={isChatLoading}
                    />
                    <button type="submit" className={styles.chatButton} disabled={isChatLoading}>
                        {isChatLoading ? (
                            <Loader2 className={`${styles.loader} w-5 h-5`} />
                        ) : (
                            <>
                                <Search className="w-5 h-5" />
                                <span>Send</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
