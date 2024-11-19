const apiUrl = 'http://10.7.90.42:3000/api/tickets'; // Endpoint API untuk tiket

    // Fungsi untuk mengambil data tiket dari API dan menampilkannya
    function fetchTickets() {
      fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
          const ticketTable = document.querySelector('#ticketTable tbody');
          ticketTable.innerHTML = ''; // Kosongkan tabel sebelum menambah data baru
          data.forEach(ticket => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${ticket.id}</td>
              <td>${ticket.customer_id}</td>
              <td>${ticket.customer_name}</td>
              <td>${ticket.product_list}</td>
              <td>${ticket.describe_issue}</td>
              <td>${ticket.priority}</td>
              <td>
                <button onclick="editTicket(${ticket.id})">Edit</button>
                <button onclick="deleteTicket(${ticket.id})">Delete</button>
              </td>
            `;
            ticketTable.appendChild(row);
          });
        })
        .catch(error => console.error('Error fetching tickets:', error));
    }

    // Fungsi untuk menghapus tiket
    function deleteTicket(ticketId) {
      fetch(`${apiUrl}/${ticketId}`, {
        method: 'DELETE',
      })
        .then(response => response.json())
        .then(data => {
          alert(data.message); // Tampilkan pesan sukses
          fetchTickets(); // Perbarui daftar tiket setelah penghapusan
        })
        .catch(error => console.error('Error deleting ticket:', error));
    }

    // Fungsi untuk mengedit tiket (menampilkan data tiket di formulir)
    function editTicket(ticketId) {
    fetch(`${apiUrl}/${ticketId}`)  // Perhatikan `${apiUrl}/${ticketId}`
        .then(response => {
        if (!response.ok) {
            throw new Error('Ticket not found');
        }
        return response.json();
        })
        .then(ticket => {
        // Isi formulir dengan data tiket yang akan diedit
        document.querySelector('input[name="customer_id"]').value = ticket.customer_id;
        document.querySelector('input[name="customer_name"]').value = ticket.customer_name;
        document.querySelector('textarea[name="product_list"]').value = ticket.product_list;
        document.querySelector('textarea[name="describe_issue"]').value = ticket.describe_issue;
        document.querySelector('textarea[name="detail_issue"]').value = ticket.detail_issue;
        document.querySelector('input[name="contact"]').value = ticket.contact;
        document.querySelector('select[name="priority"]').value = ticket.priority;
        
        // Tambahkan ID tiket ke dalam form untuk proses update
        const form = document.getElementById('ticketForm');
        const ticketIdField = document.createElement('input');
        ticketIdField.type = 'hidden';
        ticketIdField.name = 'ticket_id';
        ticketIdField.value = ticket.id;
        form.appendChild(ticketIdField);

        // Ubah tombol submit menjadi tombol update
        const submitButton = form.querySelector('button');
        submitButton.textContent = 'Update Ticket';
        submitButton.onclick = function(event) {
            event.preventDefault(); // Menghindari form submit biasa
            updateTicket(ticket.id);
        };
        })
        .catch(error => {
        console.error('Error fetching ticket:', error);
        alert('Ticket not found or server error');
        });
    }



    // Fungsi untuk mengupdate tiket
    function updateTicket(ticketId) {
      const formData = new FormData(document.getElementById('ticketForm'));
      const ticketData = {
        customer_id: formData.get('customer_id'),
        customer_name: formData.get('customer_name'),
        product_list: formData.get('product_list'),
        describe_issue: formData.get('describe_issue'),
        detail_issue: formData.get('detail_issue'),
        priority: formData.get('priority'),
        contact: formData.get('contact')
      };

      fetch(`${apiUrl}/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      })
        .then(response => response.json())
        .then(data => {
          alert(data.message); // Tampilkan pesan sukses
          fetchTickets(); // Perbarui daftar tiket setelah update
        })
        .catch(error => console.error('Error updating ticket:', error));
    }

    // Fungsi untuk membuat tiket baru
    const ticketForm = document.getElementById('ticketForm');
    ticketForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(ticketForm);
      const ticketData = {
        customer_id: formData.get('customer_id'),
        customer_name: formData.get('customer_name'),
        product_list: formData.get('product_list'),
        describe_issue: formData.get('describe_issue'),
        detail_issue: formData.get('detail_issue'),
        contact: formData.get('contact'),
        priority: formData.get('priority')
      };

      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      })
        .then(response => response.json())
        .then(data => {
          alert(data.message); // Tampilkan pesan sukses
          fetchTickets(); // Perbarui daftar tiket setelah penambahan
          ticketForm.reset(); // Reset form
        })
        .catch(error => console.error('Error creating ticket:', error));
    });

    // Ambil data tiket ketika halaman pertama kali dimuat
    fetchTickets();