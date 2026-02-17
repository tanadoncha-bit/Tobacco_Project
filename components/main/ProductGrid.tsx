export default function ProductGrid({ products }: any) {
  return (
    <div className="max-w-6xl mx-auto mt-16">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
        {products.map((product: any) => (
          <div key={product.id} className="text-center">
            <img
              src={product.imageUrl}
              className="h-48 w-full object-cover rounded-lg mb-4"
            />
            <p className="text-lg font-medium">{product.name}</p>
            <p className="text-purple-600 font-bold">
              ฿{product.price}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
