
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("new", views.new_post, name="new"),
    path("posts/<int:page>", views.posts, name="posts"),
    path("profile/<str:username>/<int:page>", views.profile, name="profile"),
    path("following/<int:page>", views.following, name="following")
]
