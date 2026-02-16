import React from "react";

interface ImagePreviewProps {
  url: string;
  onClose: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ url, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <img
        src={url}
        alt="Preview"
        className="max-w-[90%] max-h-[80%] rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 object-contain"
      />
    </div>
  );
};
