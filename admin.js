let transaksi = [];

const formatRupiah = (angka) => {

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }).format(Number(angka) || 0);

};


// =========================
// CEK LOGIN
// =========================

async function cekLogin() {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (session) {

        document.getElementById("loginBox").hidden = true;

        document.getElementById("adminPanel").hidden = false;

        loadTransactions();

    }

}


// =========================
// LOGIN
// =========================

document.getElementById("loginForm")
    .addEventListener("submit", async function(e) {

        e.preventDefault();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;


        const { error } =
            await supabaseClient.auth.signInWithPassword({
                email,
                password
            });


        if (error) {

            document.getElementById("loginMessage")
                .textContent =
                "Email atau password salah.";

            return;
        }


        document.getElementById("loginMessage")
            .textContent = "";

        document.getElementById("loginBox").hidden = true;

        document.getElementById("adminPanel").hidden = false;

        loadTransactions();

    });


// =========================
// LOGOUT
// =========================

document.getElementById("logoutBtn")
    .addEventListener("click", async function() {

        await supabaseClient.auth.signOut();

        location.reload();

    });


// =========================
// LOAD DATA
// =========================

async function loadTransactions() {

    const { data, error } =
        await supabaseClient
            .from("transaksi")
            .select("*")
            .order("tanggal", {
                ascending: false
            })
            .order("id", {
                ascending: false
            });


    if (error) {

        console.error(error);

        return;
    }


    transaksi = data || [];

    renderTable();

    updateSummary();

}


// =========================
// SUMMARY
// =========================

function updateSummary() {

    let masuk = 0;
    let keluar = 0;


    transaksi.forEach(item => {

        if (item.jenis === "masuk") {

            masuk += Number(item.nominal);

        } else {

            keluar += Number(item.nominal);

        }

    });


    document.getElementById("adminMasuk")
        .textContent = formatRupiah(masuk);

    document.getElementById("adminKeluar")
        .textContent = formatRupiah(keluar);

    document.getElementById("adminSaldo")
        .textContent = formatRupiah(masuk - keluar);

}


// =========================
// TAMBAH TRANSAKSI
// =========================

document.getElementById("transactionForm")
    .addEventListener("submit", async function(e) {

        e.preventDefault();


        const tanggal =
            document.getElementById("tanggal").value;

        const keterangan =
            document.getElementById("keterangan").value.trim();

        const jenis =
            document.getElementById("jenis").value;

        const nominal =
            Number(document.getElementById("nominal").value);


        if (!tanggal || !keterangan || !nominal) {

            return;

        }


        const { error } =
            await supabaseClient
                .from("transaksi")
                .insert({
                    tanggal,
                    keterangan,
                    jenis,
                    nominal
                });


        if (error) {

            alert(error.message);

            return;

        }


        this.reset();

        document.getElementById("formMessage")
            .textContent =
            "Transaksi berhasil disimpan.";

        await loadTransactions();

    });


// =========================
// TABEL
// =========================

function renderTable() {

    const tbody =
        document.getElementById("adminTableBody");


    if (!transaksi.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    Belum ada transaksi.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML = transaksi.map(item => {

        const masuk =
            item.jenis === "masuk";


        return `

            <tr>

                <td>
                    ${item.tanggal}
                </td>

                <td>
                    ${escapeHTML(item.keterangan)}
                </td>

                <td>
                    ${masuk ? "Masuk" : "Keluar"}
                </td>

                <td>
                    ${formatRupiah(item.nominal)}
                </td>

                <td>

                    <button
                        class="btn-edit"
                        onclick="editTransaction(${item.id})">
                        ✏️
                    </button>

                    <button
                        class="btn-danger"
                        onclick="deleteTransaction(${item.id})">
                        🗑️
                    </button>

                </td>

            </tr>

        `;

    }).join("");

}


// =========================
// EDIT
// =========================

async function editTransaction(id) {

    const item =
        transaksi.find(x => x.id === id);

    if (!item) return;


    const nominalBaru =
        prompt(
            "Masukkan nominal baru:",
            item.nominal
        );


    if (nominalBaru === null) return;


    const nominal =
        Number(nominalBaru);


    if (!nominal || nominal <= 0) {

        alert("Nominal tidak valid.");

        return;

    }


    const { error } =
        await supabaseClient
            .from("transaksi")
            .update({
                nominal
            })
            .eq("id", id);


    if (error) {

        alert(error.message);

        return;

    }


    loadTransactions();

}


// =========================
// HAPUS
// =========================

async function deleteTransaction(id) {

    if (!confirm(
        "Yakin ingin menghapus transaksi ini?"
    )) {

        return;

    }


    const { error } =
        await supabaseClient
            .from("transaksi")
            .delete()
            .eq("id", id);


    if (error) {

        alert(error.message);

        return;

    }


    loadTransactions();

}


// =========================
// SECURITY
// =========================

function escapeHTML(text) {

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


cekLogin();