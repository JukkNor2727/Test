<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>ระบบกรอกข้อมูล</title>
  <style>
    body {
      font-family: sans-serif;
      background: #f0f0f0;
      padding: 20px;
    }
    .container {
      background: #fff;
      padding: 30px;
      border-radius: 12px;
      max-width: 500px;
      margin: auto;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    label {
      display: block;
      margin-top: 15px;
      font-weight: bold;
    }
    input {
      width: 100%;
      padding: 8px;
      margin-top: 5px;
      border: 1px solid #ccc;
      border-radius: 6px;
    }
    button {
      margin-top: 20px;
      padding: 10px 20px;
      background: #0d9488;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    #status {
      margin-top: 20px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>ฟอร์มกรอกข้อมูล</h2>
    <form id="dataForm">
      <label for="a">a</label>
      <input type="text" id="a" name="a" required />

      <label for="s">s</label>
      <input type="text" id="s" name="s" required />

      <label for="d">d</label>
      <input type="text" id="d" name="d" required />

      <label for="f">f</label>
      <input type="text" id="f" name="f" required />

      <label for="g">g</label>
      <input type="text" id="g" name="g" required />

      <button type="submit">ส่งข้อมูล</button>
    </form>
    <div id="status"></div>
  </div>

  <script>
    const scriptURL = 'https://script.google.com/macros/s/AKfycbxVz-9d2svgMVAahRL6Vk4PIlmPMxPQ7KvUcY_gLLHdEqUKx57jxYqRFi2Wmy-_Ym65/exec';
    const form = document.getElementById('dataForm');
    const status = document.getElementById('status');

    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = new FormData(form);
      const jsonData = Object.fromEntries(data.entries());

      fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify(jsonData),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(res => {
        status.textContent = res.success ? '✅ ส่งข้อมูลเรียบร้อยแล้ว' : '❌ เกิดข้อผิดพลาด';
        form.reset();
      })
      .catch(error => {
        console.error('Error!', error.message);
        status.textContent = '⚠️ ไม่สามารถส่งข้อมูลได้';
      });
    });
  </script>
</body>
</html>
