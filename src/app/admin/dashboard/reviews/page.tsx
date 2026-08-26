import { redirect } from 'next/navigation';

export default function OldReviewsRedirect() {
    redirect('/admin/dashboard/comments');
}
