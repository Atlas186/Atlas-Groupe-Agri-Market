
  function Navbar() {
    return (
      <nav className="bg-green-800 p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <a href="/" className="text-white text-2xl font-bold">
            Atlas-Groupe-Agri-Market
          </a>
          <div className="space-x-4">
            <a href="#" className="text-gray-300 hover:text-white">Produits</a>
            <a href="#" className="text-gray-300 hover:text-white">Catégories</a>
            <a href="#" className="text-gray-300 hover:text-white">À Propos</a>
            <a href="#" className="text-gray-300 hover:text-white">Contact</a>
          </div>
        </div>
      </nav>
    );
  }

  export default Navbar;

