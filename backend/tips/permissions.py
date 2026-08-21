from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsTipOwnerOrReadOnly(BasePermission):
    """
    Allow tip owner to edit/delete their own tips.
    Others can only read.
    """
    
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.user == request.user


class CanViewTip(BasePermission):
    """
    Check if user can view tip based on visibility setting.
    """
    
    def has_object_permission(self, request, view, obj):
        # Public tips visible to all
        if obj.visibility == "PUBLIC":
            return True
        
        # Private tips only visible to creator
        if obj.visibility == "PRIVATE":
            return obj.user == request.user or request.user.is_staff
        
        # Followers-only tips visible to followers
        if obj.visibility == "FOLLOWERS":
            if obj.user == request.user:
                return True
            # Check if user follows tipster
            return obj.user.followers.filter(id=request.user.id).exists()
        
        return False