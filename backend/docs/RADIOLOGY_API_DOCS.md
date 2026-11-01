

### File Upload Endpoint
**Endpoint:** `POST /api/radiology/upload`
**Content-Type:** `multipart/form-data`



**Form Fields:**

- `xray_image` (File) - The X-ray image file

- `request_id` (Number) - ID of the radiology request

- `radiologist_id` (Number) - ID of radiologist uploading



**Accepted File Types:**

- JPEG (.jpg, .jpeg)

- PNG (.png)

- DICOM (.dcm, .dicom)



**Max File Size:** 50MB



**Frontend Example (React):**

```javascript

const handleUpload = async (file) => {

  const formData = new FormData();

  formData.append('xray_image', file);

  formData.append('request_id', 1);

  formData.append('radiologist_id', 4);



  const response = await fetch('/api/radiology/upload', {

    method: 'POST',

    body: formData

  });

  

  const data = await response.json();

  console.log(data);

};

```



**Get Image:**

`GET /uploads/radiology/2026/01/filename.jpg`

```