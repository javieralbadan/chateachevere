const Loading = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-off-white z-50">
      <div className="relative w-24 h-24">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-primary-color rounded-full opacity-25 animate-ping"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-t-primary-color border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <div className="mt-32 text-center text-primary-color font-medium">Cargando...</div>
      </div>
    </div>
  );
};

export default Loading;
