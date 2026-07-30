// TODO: Product detail page
export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  return <div>Product: {params.slug}</div>;
}
