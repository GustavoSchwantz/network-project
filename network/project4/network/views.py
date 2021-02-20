from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import json, math
from django.core.paginator import Paginator

from .models import Post, User


def index(request):
    return render(request, "network/index.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


@csrf_exempt
@login_required
def new_post(request):

    # Writing a new post must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)
    
    # Get content of post
    data = json.loads(request.body)
    content = data.get("post", "")

    # Create a post
    post = Post(
        username=request.user.username,
        content=content
    )
    post.save()

    return JsonResponse({"message": "Post sent successfully."}, status=201)


@csrf_exempt
def like_post(request, post_id):

    # Like/unlike a post must be via PUT
    if request.method != "PUT":
        return JsonResponse({"error": "PUT request required."}, status=400)

    # Query for the post
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found."}, status=404)    
    
    # Update whether a post is liked or unliked
    data = json.loads(request.body)    

    if data.get("like"):
        post.likes = post.likes + 1
    else:    
        post.likes = post.likes - 1

    post.save()    

    return JsonResponse({"likes": post.likes}, status=201)

@csrf_exempt
@login_required
def edit_post(request, post_id):

    # Editing a post must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)
    
    # Get content of post
    data = json.loads(request.body)
    content = data.get("post", "")

    # Query for the post
    try:
        post = Post.objects.get(username=request.user.username, pk=post_id)
    except Post.DoesNotExist:
        return JsonResponse(
            {"error": "Post not found or you do not have permition to edit it."}, 
            status=404)
    
    # Change the post content
    post.content = content
    post.save()

    return JsonResponse({"message": "Post edited successfully."}, status=201)


def posts(request, page):

    # Get all posts
    posts = Post.objects.all()

    # Put posts in reverse chronologial order
    posts = posts.order_by("-timestamp").all()

    # Creates a Paginator with 10 itens per page 
    paginator = Paginator(posts, 10)

    hasPrevious = True
    hasNext     = True
    
    # It is not possible acess a page smaller than 1
    if page < 1:
        page = 1
        hasPrevious = False
    
    # It is not possible acess a page bigger than the last page number
    if page > math.ceil(posts.count() / 10):
        page = math.ceil(posts.count() / 10)
        hasNext = False
    
    # Get posts from a specific page
    posts = paginator.page(page).object_list

    return JsonResponse({
        "previous": hasPrevious,
        "next": hasNext,
        "posts": [post.serialize() for post in posts]}, 
        safe=False)
  

@csrf_exempt
def profile(request, username, page):
    
    # Query for requested user
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found."}, status=404)

    if request.method == "GET":
    
        # Get the number of people that the user follows, as well as the number of followers the user has
        follows = user.follows.count()   
        followers = user.followers.count() 
        
        # Verify if the current user is following the owner of the visited profile
        following = user.followers.filter(username=request.user.username).exists()

        # Get all posts from that user and put them in reverse chronological order
        posts = Post.objects.filter(username=username)
        posts = posts.order_by("-timestamp").all()

        # Creates a Paginator with 10 itens per page 
        paginator = Paginator(posts, 10)

        hasPrevious = True
        hasNext     = True
    
        # It is not possible acess a page smaller than 1
        if page < 1:
            page = 1
            hasPrevious = False
    
        # It is not possible acess a page bigger than the last page number
        if page > math.ceil(posts.count() / 10):
            page = math.ceil(posts.count() / 10)
            hasNext = False
    
        # Get posts from a specific page
        posts = paginator.page(page).object_list
    
        # Return all information in a JSON object
        return JsonResponse({
            "follows": follows,
            "followers": followers,
            "following": following,
            "other": request.user != user, # It tells if a user is acessing her/his own profile (if nobody is log in, request.user = AnonymousUser)
            "previous": hasPrevious,
            "next": hasNext,
            "posts": [post.serialize() for post in posts]
            }, status=201)    
    
    # Update if current user whether or not they are following this user’s posts
    elif request.method == "PUT":        
        data = json.loads(request.body)
        if not data.get("follow"):
            request.user.follows.add(user)
        else:
            request.user.follows.remove(user)  
        return JsonResponse({"message": "Changes added to the server."}, status=201) 
    
    # Profile must be via GET or PUT
    else:
        return JsonResponse({
            "error": "GET or PUT request required."
        }, status=400)


@login_required
def following(request, page):

    # Get all users that the current user follows
    users = request.user.follows.all()
    
    # Create an empty query set
    posts = Post.objects.none()
    
    # For each username that the current user follows, get all posts
    # from that username and add them into the posts query set
    for username in [user.username for user in users]:
        posts = posts | Post.objects.filter(username=username) 

    # Put posts in reverse chronologial order
    posts = posts.order_by("-timestamp").all()

    # Creates a Paginator with 10 itens per page 
    paginator = Paginator(posts, 10)

    hasPrevious = True
    hasNext     = True
    
    # It is not possible acess a page smaller than 1
    if page < 1:
        page = 1
        hasPrevious = False
    
    # It is not possible acess a page bigger than the last page number
    if page > math.ceil(posts.count() / 10):
        page = math.ceil(posts.count() / 10)
        hasNext = False
    
    # Get posts from a specific page
    posts = paginator.page(page).object_list

    return JsonResponse({
        "previous": hasPrevious,
        "next": hasNext,
        "posts": [post.serialize() for post in posts]}, 
        safe=False)

