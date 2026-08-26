import { redirect } from 'next/navigation';

export default function OldBlogCommentsRedirect() {
    redirect('/admin/dashboard/comments');
}
