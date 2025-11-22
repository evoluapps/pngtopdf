document.addEventListener('DOMContentLoaded', function() {
    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    
    // App functionality
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const convertBtn = document.getElementById('convertBtn');
    const resetBtn = document.getElementById('resetBtn');
    const previewContainer = document.getElementById('previewContainer');
    const imageList = document.getElementById('imageList');
    const resultSection = document.getElementById('resultSection');
    const downloadBtn = document.getElementById('downloadBtn');
    const statusMessage = document.getElementById('statusMessage');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    
    let selectedFiles = [];
    let pdfBlob = null;
    
    // Event listeners for drag and drop
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    });
    
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    });
    
    function handleFiles(files) {
        // Filter only PNG files
        const pngFiles = files.filter(file => file.type === 'image/png' || file.name.toLowerCase().endsWith('.png'));
        
        if (pngFiles.length === 0) {
            showStatus('Please select PNG files only.', 'error');
            return;
        }
        
        selectedFiles = pngFiles;
        convertBtn.disabled = false;
        
        // Show previews
        showImagePreviews(pngFiles);
    }
    
    function showImagePreviews(files) {
        imageList.innerHTML = '';
        previewContainer.style.display = 'block';
        
        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'thumbnail';
                img.alt = `Preview ${index + 1}`;
                imageList.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    }
    
    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message';
        statusMessage.classList.add(`status-${type}`);
        statusMessage.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
    }
    
    function updateProgress(percent) {
        progressContainer.style.display = 'block';
        progressBar.style.width = `${percent}%`;
    }
    
    convertBtn.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;
        
        try {
            convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
            convertBtn.disabled = true;
            
            // Create PDF
            const pdf = new jsPDF();
            
            // Process each image with optimized speed
            for (let i = 0; i < selectedFiles.length; i++) {
                updateProgress((i / selectedFiles.length) * 100);
                
                const file = selectedFiles[i];
                const imgData = await readFileAsDataURL(file);
                
                // Add image to PDF
                if (i > 0) {
                    pdf.addPage();
                }
                
                // Get image dimensions
                const img = new Image();
                img.src = imgData;
                
                // Optimized image processing for faster conversion
                await new Promise(resolve => {
                    img.onload = () => {
                        // Calculate dimensions to fit page
                        const pageWidth = pdf.internal.pageSize.getWidth();
                        const pageHeight = pdf.internal.pageSize.getHeight();
                        const imgRatio = img.width / img.height;
                        const pageRatio = pageWidth / pageHeight;
                        
                        let imgWidth, imgHeight;
                        
                        if (imgRatio > pageRatio) {
                            imgWidth = pageWidth;
                            imgHeight = pageWidth / imgRatio;
                        } else {
                            imgHeight = pageHeight;
                            imgWidth = pageHeight * imgRatio;
                        }
                        
                        // Center image on page
                        const x = (pageWidth - imgWidth) / 2;
                        const y = (pageHeight - imgHeight) / 2;
                        
                        // Add image with optimized quality
                        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight, undefined, 'FAST');
                        resolve();
                    };
                });
            }
            
            updateProgress(100);
            
            // Save PDF as blob
            pdfBlob = pdf.output('blob');
            
            // Show result
            setTimeout(() => {
                convertBtn.innerHTML = '<i class="fas fa-check"></i> Converted!';
                resultSection.style.display = 'block';
                progressContainer.style.display = 'none';
                
                // Reset button after delay
                setTimeout(() => {
                    convertBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Convert to PDF';
                    convertBtn.disabled = false;
                }, 1000);
            }, 300);
        } catch (error) {
            console.error('Conversion error:', error);
            showStatus('Error during conversion. Please try again.', 'error');
            convertBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Convert to PDF';
            convertBtn.disabled = false;
            progressContainer.style.display = 'none';
        }
    });
    
    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    resetBtn.addEventListener('click', () => {
        fileInput.value = '';
        selectedFiles = [];
        convertBtn.disabled = true;
        previewContainer.style.display = 'none';
        resultSection.style.display = 'none';
        convertBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Convert to PDF';
        progressContainer.style.display = 'none';
        statusMessage.style.display = 'none';
        pdfBlob = null;
    });
    
    downloadBtn.addEventListener('click', () => {
        if (!pdfBlob) {
            showStatus('No PDF available for download.', 'error');
            return;
        }
        
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `converted-${new Date().getTime()}.pdf`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    });
});