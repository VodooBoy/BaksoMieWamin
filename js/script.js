document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. LOGIKA QUICK FILTER MENU ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    const menuItems = document.querySelectorAll('.filter-target');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const selectedCategory = button.getAttribute('data-filter');

            menuItems.forEach(item => {
                if (selectedCategory === 'all' || item.classList.contains(selectedCategory)) {
                    item.classList.remove('hide');
                } else {
                    item.classList.add('hide');
                }
            });
        });
    });

    // --- 2. LOGIKA KERANJANG BELANJA (CART) ---
    let cart = []; // Array untuk menyimpan pesanan

    const addCartBtns = document.querySelectorAll('.add-cart-btn');
    const floatingCart = document.getElementById('floating-cart');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCartBtn = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const totalPriceEl = document.getElementById('total-price');
    
    // Elemen Checkout & QRIS
    const orderTypeRadios = document.querySelectorAll('input[name="order-type"]');
    const tableNumberInput = document.getElementById('table-number');
    const customerAddressInput = document.getElementById('customer-address');
    const btnShowQris = document.getElementById('btn-show-qris');
    const qrisSection = document.getElementById('qris-section');
    const qrisAmount = document.getElementById('qris-amount');
    const checkoutBtn = document.getElementById('checkout-btn');

    // Fungsi Format Rupiah (cth: Rp28.000)
    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    }

    // Fungsi Memperbarui Tampilan Keranjang
    const updateCartUI = () => {
        cartItemsContainer.innerHTML = '';
        let total = 0;
        let count = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align:center; color:#8c8c8c; margin-top:50px;">Keranjang masih kosong.</p>';
            // Sembunyikan QRIS dan kembalikan tombol bayar jika keranjang dikosongkan
            btnShowQris.classList.remove('hide');
            qrisSection.classList.add('hide');
        } else {
            cart.forEach((item, index) => {
                total += item.price * item.qty;
                count += item.qty;

                cartItemsContainer.innerHTML += `
                    <div class="cart-item">
                        <div class="cart-item-info">
                            <h4>${item.name}</h4>
                            <p>${formatRupiah(item.price * item.qty)}</p>
                        </div>
                        <div class="cart-item-qty">
                            <button class="qty-btn minus" data-index="${index}">-</button>
                            <span>${item.qty}</span>
                            <button class="qty-btn plus" data-index="${index}">+</button>
                        </div>
                    </div>
                `;
            });
        }

        cartCount.innerText = count;
        totalPriceEl.innerText = formatRupiah(total);
        
        // Perbarui angka total di bagian QRIS secara realtime
        qrisAmount.innerText = formatRupiah(total);

        // Pasang event listener untuk tombol tambah/kurang qty
        document.querySelectorAll('.qty-btn.plus').forEach(btn => {
            btn.addEventListener('click', (e) => changeQty(e.target.dataset.index, 1));
        });
        document.querySelectorAll('.qty-btn.minus').forEach(btn => {
            btn.addEventListener('click', (e) => changeQty(e.target.dataset.index, -1));
        });
    }

    // Fungsi Menambah/Mengurangi Jumlah
    const changeQty = (index, change) => {
        cart[index].qty += change;
        if (cart[index].qty <= 0) {
            cart.splice(index, 1); // Hapus item jika qty = 0
        }
        updateCartUI();
    }

    // Menambah item saat tombol "+ Keranjang" di klik
    addCartBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.getAttribute('data-name');
            const price = parseInt(btn.getAttribute('data-price'));

            // Cek apakah item sudah ada di keranjang
            const existingItem = cart.find(item => item.name === name);
            if (existingItem) {
                existingItem.qty += 1;
            } else {
                cart.push({ name, price, qty: 1 });
            }
            
            updateCartUI();
            
            // Animasi kecil pada tombol floating saat barang ditambah
            floatingCart.style.transform = 'scale(1.2)';
            setTimeout(() => floatingCart.style.transform = 'scale(1)', 200);
        });
    });

    // Buka/Tutup Sidebar Keranjang
    floatingCart.addEventListener('click', () => {
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
    });

    const closeCart = () => {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
    }
    closeCartBtn.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);


    // --- 3. LOGIKA FORM TIPE PESANAN (MUNCUL/HILANG) ---
    orderTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const selectedType = e.target.value;
            
            // Sembunyikan semua input terlebih dahulu
            tableNumberInput.classList.add('hide');
            customerAddressInput.classList.add('hide');

            // Munculkan input yang sesuai
            if (selectedType === 'dine-in') {
                tableNumberInput.classList.remove('hide');
            } else if (selectedType === 'delivery') {
                customerAddressInput.classList.remove('hide');
            }
            // Jika take-away, kedua input tetap tersembunyi
        });
    });


    // --- 4. LOGIKA TOMBOL "LANJUT PEMBAYARAN" (VALIDASI & TAMPILKAN QRIS) ---
    btnShowQris.addEventListener('click', () => {
        if (cart.length === 0) {
            alert("Keranjang masih kosong. Silakan pilih menu terlebih dahulu!");
            return;
        }

        const selectedType = document.querySelector('input[name="order-type"]:checked').value;
        
        // Validasi: Wajib isi Meja jika Dine-in
        if (selectedType === 'dine-in' && tableNumberInput.value.trim() === '') {
            alert("Mohon isi Nomor Meja Anda terlebih dahulu!");
            tableNumberInput.focus();
            return;
        }
        
        // Validasi: Wajib isi Alamat jika Delivery
        if (selectedType === 'delivery' && customerAddressInput.value.trim() === '') {
            alert("Mohon isi Alamat Lengkap pengiriman terlebih dahulu!");
            customerAddressInput.focus();
            return;
        }

        // Lolos validasi -> Tampilkan QRIS, Sembunyikan tombol awal
        btnShowQris.classList.add('hide');
        qrisSection.classList.remove('hide');
    });


    // --- 5. LOGIKA CHECKOUT AKHIR KE WHATSAPP ---
    checkoutBtn.addEventListener('click', () => {
        
        const noWhatsApp = "6281380042632"; // Nomor Admin Utama (Menerima Pesanan)

        // Ambil nilai data pesanan
        const selectedType = document.querySelector('input[name="order-type"]:checked').value;
        const tableNumber = tableNumberInput.value.trim();
        const customerAddress = customerAddressInput.value.trim();
        
        // Buat Order ID Acak
        const orderId = 'WAMIN-' + Math.floor(1000 + Math.random() * 9000);
        
        // --- Menyusun Teks WhatsApp ---
        let message = `Halo Bakso Mie Wamin, saya mau pesan:%0A%0A`;
        message += `*Nomor Order:* ${orderId}%0A`;
        
        if (selectedType === 'dine-in') {
            message += `*Tipe Pesanan:* Dine-in (Makan di Sini)%0A`;
            message += `*Nomor Meja:* ${tableNumber}%0A`;
        } else if (selectedType === 'delivery') {
            message += `*Tipe Pesanan:* Delivery (Pesan Antar)%0A`;
            message += `*Alamat Pengiriman:* ${customerAddress}%0A`;
        } else if (selectedType === 'take-away') {
            message += `*Tipe Pesanan:* Take Away (Bawa Pulang)%0A`;
        }
        
        message += `---------------------------%0A`;

        let totalAmount = 0;
        cart.forEach(item => {
            message += `${item.qty}x ${item.name} - ${formatRupiah(item.price * item.qty)}%0A`;
            totalAmount += (item.price * item.qty);
        });

        message += `---------------------------%0A`;
        message += `*Total Pembayaran: ${formatRupiah(totalAmount)}*%0A%0A`;
        
        // Kunci Konfirmasi (Pengganti Midtrans Otomatis)
        message += `✅ *SAYA MELAMPIRKAN BUKTI TRANSFER QRIS PADA PESAN INI.*%0A%0A`;
        message += `Mohon segera dicek dan diproses, terima kasih!`;

        // Eksekusi buka WhatsApp
        const waLink = `https://wa.me/${noWhatsApp}?text=${message}`;
        window.open(waLink, '_blank');
    });

});