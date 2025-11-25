export const uploadToImgBB = async (file) => {
  const apiKey = 'e69966f319cd4a033a3a6eb09c8df789'; // <--- REEMPLAZA ESTO
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (data.success) {
      return data.data.url;
    } else {
      throw new Error('Error al subir imagen a ImgBB');
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};