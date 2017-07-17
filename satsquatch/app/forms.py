from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User


class SignUpForm(UserCreationForm):

	username = forms.CharField(
		max_length=30, 
		required=True,
		label='username', 
		widget=forms.TextInput(
			attrs={'class': 'form-control', 'placeholder': 'Username'}
		)
	)
	email = forms.EmailField(
		max_length=254, 
		required=True,
		label='Email', 
		widget=forms.TextInput(
			attrs={'class': 'form-control', 'placeholder': 'Email'}
		)
	)
	full_name = forms.CharField(
		max_length=30, 
		required=False,
		label='Full_Name', 
		widget=forms.TextInput(
			attrs={'class': 'form-control', 'placeholder': 'Full Name'}
		)
	)
	password1 = forms.CharField(
		widget=forms.PasswordInput(
			attrs={'class': 'form-control', 'placeholder': 'Password'}
		)
	)
	password2 = forms.CharField(
		widget=forms.PasswordInput(
			attrs={'class': 'form-control', 'placeholder': 'Retype Password'}
		)
	)




	class Meta:
		model = User
		fields = ('username', 'email', 'full_name', 'password1', 'password2')