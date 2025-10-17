// src/pages/js/diskusi.js
// [FINAL] - Menambahkan fungsionalitas untuk tombol "Suka" (like).

import { getCommunityDiscussions, postCommunityDiscussion, postCommunityReply, toggleLikePost } from '/src/services/api.js';
import { getSession } from '/src/services/state.js';
import { timeAgo } from '/src/services/utils.js';

// --- State Halaman ---
let allDiscussions = [];
let currentOpenPostId = null;
const LIKED_POSTS_KEY = 'goPontrenLikedPosts'; // Kunci untuk localStorage

// --- Helper Functions ---
const getInitials = (name = '') => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
const getLikedPosts = () => JSON.parse(localStorage.getItem(LIKED_POSTS_KEY)) || [];
const saveLikedPosts = (likedPosts) => localStorage.setItem(LIKED_POSTS_KEY, JSON.stringify(likedPosts));

// --- Fungsi untuk Merender Tampilan ---

function renderDiscussionFeed() {
    const feedContainer = document.getElementById('diskusi-feed');
    const template = document.getElementById('discussion-post-template');
    if (!feedContainer || !template) return;

    const sortedData = [...allDiscussions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const likedPosts = getLikedPosts();
    
    feedContainer.innerHTML = ''; 

    if (sortedData.length === 0) {
        feedContainer.innerHTML = `<p class="text-center text-slate-500 p-8">Jadilah yang pertama memulai diskusi!</p>`;
        return;
    }

    const fragment = document.createDocumentFragment();
    sortedData.forEach(post => {
        const clone = template.content.cloneNode(true);
        const postItem = clone.querySelector('.discussion-post-item');
        postItem.dataset.postId = post.id;
        
        postItem.querySelector('.post-author-avatar').textContent = getInitials(post.author.name);
        postItem.querySelector('.post-author-name').textContent = post.author.name;
        postItem.querySelector('.post-timestamp').textContent = timeAgo(post.timestamp);
        postItem.querySelector('.post-content').textContent = post.content;
        postItem.querySelector('.post-likes').textContent = post.likes;
        postItem.querySelector('.post-comments').textContent = post.replies.length;

        // [BARU] Atur tampilan tombol like
        const likeButton = postItem.querySelector('.like-btn');
        const likeIcon = likeButton.querySelector('i');
        if (likedPosts.includes(post.id)) {
            likeButton.classList.add('text-emerald-600');
            likeIcon.setAttribute('fill', 'currentColor'); // Isi ikon jika sudah di-like
        }

        fragment.appendChild(clone);
    });
        
    feedContainer.appendChild(fragment);
    lucide.createIcons();
}

function renderMainPostInModal(post) {
    const container = document.getElementById('thread-main-post-container');
    const template = document.getElementById('thread-main-post-template');
    if (!container || !template) return;

    container.innerHTML = '';
    const clone = template.content.cloneNode(true);
    clone.querySelector('.post-author-avatar').textContent = getInitials(post.author.name);
    clone.querySelector('.post-author-name').textContent = post.author.name;
    clone.querySelector('.post-timestamp').textContent = timeAgo(post.timestamp);
    clone.querySelector('.post-content').textContent = post.content;
    container.appendChild(clone);
}

function renderRepliesInModal(replies) {
    const container = document.getElementById('thread-replies-container');
    const template = document.getElementById('reply-item-template');
    if (!container || !template) return;

    container.innerHTML = '';
    if (replies.length === 0) {
        container.innerHTML = `<p class="text-center text-sm text-slate-500 py-4">Belum ada balasan.</p>`;
        return;
    }
    
    const fragment = document.createDocumentFragment();
    replies.forEach(reply => {
        fragment.appendChild(createReplyElement(reply));
    });
    container.appendChild(fragment);
}

function createReplyElement(reply) {
    const template = document.getElementById('reply-item-template');
    const clone = template.content.cloneNode(true);
    clone.querySelector('.reply-author-avatar').textContent = getInitials(reply.author.name);
    clone.querySelector('.reply-author-name').textContent = reply.author.name;
    clone.querySelector('.reply-timestamp').textContent = timeAgo(reply.timestamp);
    clone.querySelector('.reply-content').textContent = reply.content;
    return clone;
}

// --- Fungsi untuk Mengelola Modal ---

function openThreadModal(postId) {
    currentOpenPostId = postId;
    const postData = allDiscussions.find(p => p.id === postId);
    if (!postData) return;

    const modal = document.getElementById('thread-modal');
    const modalContent = document.getElementById('thread-modal-content');
    const bottomNav = document.getElementById('bottom-nav');

    renderMainPostInModal(postData);
    renderRepliesInModal(postData.replies);

    modal.classList.remove('hidden');
    if (bottomNav) bottomNav.style.display = 'none';

    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('translate-y-full');
    }, 10);
}

function closeThreadModal() {
    const modal = document.getElementById('thread-modal');
    const modalContent = document.getElementById('thread-modal-content');
    const bottomNav = document.getElementById('bottom-nav');

    modal.classList.add('opacity-0');
    modalContent.classList.add('translate-y-full');
    
    setTimeout(() => {
        modal.classList.add('hidden');
        if (bottomNav) bottomNav.style.display = 'block';
        currentOpenPostId = null;
    }, 300);
}

// --- Fungsi untuk Menangani Interaksi Pengguna ---

function handlePostSubmit() {
    const input = document.getElementById('post-input');
    const button = document.getElementById('kirim-post-btn');
    const session = getSession();

    button.addEventListener('click', async () => {
        const content = input.value.trim();
        if (content === '') return;

        button.disabled = true;
        button.textContent = 'Mengirim...';

        try {
            const newPostData = { author: { id: session.user.id, name: session.user.name }, content };
            const response = await postCommunityDiscussion(newPostData);
            
            allDiscussions.push(response.data);
            renderDiscussionFeed();
            input.value = '';
        } catch (error) {
            console.error("Error saat mengirim post:", error);
            alert("Gagal mengirim postingan.");
        } finally {
            button.disabled = false;
            button.textContent = 'Kirim';
        }
    });
}

function handleReplySubmit() {
    const input = document.getElementById('reply-input');
    const button = document.getElementById('send-reply-btn');
    const session = getSession();

    button.addEventListener('click', async () => {
        const content = input.value.trim();
        if (content === '' || !currentOpenPostId) return;

        button.disabled = true;

        try {
            const replyData = { author: { id: session.user.id, name: session.user.name }, content };
            const response = await postCommunityReply(currentOpenPostId, replyData);
            
            const postIndex = allDiscussions.findIndex(p => p.id === currentOpenPostId);
            if (postIndex > -1) {
                allDiscussions[postIndex].replies.push(response.data);
                
                renderRepliesInModal(allDiscussions[postIndex].replies);
                renderDiscussionFeed(); 
            }
            input.value = '';
        } catch (error) {
            console.error("Error saat mengirim balasan:", error);
            alert("Gagal mengirim balasan.");
        } finally {
            button.disabled = false;
        }
    });
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            button.click();
        }
    });
}

/**
 * [FUNGSI BARU] Menangani klik pada tombol "Suka".
 */
async function handleLikeClick(likeButton) {
    const postItem = likeButton.closest('.discussion-post-item');
    const postId = postItem.dataset.postId;
    if (!postId) return;

    let likedPosts = getLikedPosts();
    const isLiked = likedPosts.includes(postId);

    // Optimistic UI update
    const postIndex = allDiscussions.findIndex(p => p.id === postId);
    if (postIndex > -1) {
        allDiscussions[postIndex].likes += isLiked ? -1 : 1;
        if (isLiked) {
            likedPosts = likedPosts.filter(id => id !== postId);
        } else {
            likedPosts.push(postId);
        }
        saveLikedPosts(likedPosts);
        renderDiscussionFeed(); // Re-render untuk memperbarui semua tampilan
    }

    try {
        // Panggil API di latar belakang
        await toggleLikePost(postId, isLiked);
    } catch (error) {
        // Jika API gagal, kembalikan state UI ke semula (rollback)
        console.error("Gagal update like di server:", error);
        allDiscussions[postIndex].likes += isLiked ? 1 : -1;
        if (isLiked) {
            likedPosts.push(postId);
        } else {
            likedPosts = likedPosts.filter(id => id !== postId);
        }
        saveLikedPosts(likedPosts);
        renderDiscussionFeed();
        alert("Gagal menyukai postingan. Coba lagi.");
    }
}


// --- Inisialisasi Halaman ---

export default async function initDiskusi() {
    try {
        const response = await getCommunityDiscussions();
        allDiscussions = response.data;
        renderDiscussionFeed();
    } catch (error) {
        console.error("Gagal memuat data diskusi:", error);
        document.getElementById('diskusi-feed').innerHTML = `<p class="text-center text-red-500 p-8">Gagal memuat data.</p>`;
    }

    handlePostSubmit();
    handleReplySubmit();

    document.getElementById('diskusi-feed').addEventListener('click', (e) => {
        const replyButton = e.target.closest('.reply-btn');
        const likeButton = e.target.closest('.like-btn');

        if (replyButton) {
            const postItem = replyButton.closest('.discussion-post-item');
            if (postItem && postItem.dataset.postId) {
                openThreadModal(postItem.dataset.postId);
            }
        } else if (likeButton) {
            handleLikeClick(likeButton);
        }
    });

    document.getElementById('close-thread-modal-btn').addEventListener('click', closeThreadModal);
    document.getElementById('thread-modal').addEventListener('click', (e) => {
        if (e.target.id === 'thread-modal') {
            closeThreadModal();
        }
    });
}

