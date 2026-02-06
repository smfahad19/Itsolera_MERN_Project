import React from "react";
import { Link } from "react-router-dom";
import { FiShoppingBag, FiTruck, FiShield, FiStar } from "react-icons/fi";

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to MarketHub
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Your one-stop marketplace for quality products from trusted
              sellers worldwide.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/products"
                className="bg-white text-black px-8 py-3 rounded font-bold hover:bg-gray-100"
              >
                Shop Now
              </Link>
              <Link
                to="/register"
                className="border-2 border-white text-white px-8 py-3 rounded font-bold hover:bg-white hover:text-black"
              >
                Become a Seller
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiTruck className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-xl font-bold mb-2">Free Shipping</h3>
            <p className="text-gray-600">Free delivery on orders over $50</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiShield className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-xl font-bold mb-2">Secure Payment</h3>
            <p className="text-gray-600">100% secure payment processing</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiStar className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-xl font-bold mb-2">Quality Guarantee</h3>
            <p className="text-gray-600">30-day money back guarantee</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Start Selling?</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of successful sellers on our platform. Set up your
              store in minutes.
            </p>
            <Link
              to="/seller/dashboard"
              className="inline-flex items-center bg-black text-white px-8 py-3 rounded font-bold hover:bg-gray-800"
            >
              <FiShoppingBag className="w-5 h-5 mr-2" />
              Start Selling Today
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
