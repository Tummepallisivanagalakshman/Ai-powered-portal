import fitz  # PyMuPDF
import io

class PDFParserService:
    @staticmethod
    def extract_text(file_bytes: bytes) -> str:
        """
        Parses a PDF file from bytes and extracts all text using PyMuPDF.
        """
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text()
            return text.strip()
        except Exception as e:
            raise ValueError(f"Failed to parse PDF: {e}")
